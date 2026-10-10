const { broadcast } = require('../lib/broadcast');
const pool = require('../db/client');
const worldModel = require('../world/worldModel');

async function process(assessment, replayPhase) {
  const skus = worldModel.skus;
  const penaltyDays = assessment.lead_time_penalty_days || 0;
  const forecasts = [];

  for (const sku of skus) {
    // Adjusted hours to stockout including lead time penalty
    const currentInventory = sku.current_inventory;
    const dailyDemand = sku.daily_demand;
    const rawHours = (currentInventory / dailyDemand) * 24;
    const adjustedHours = rawHours - (penaltyDays * 24);
    const hoursToStockout = Math.max(adjustedHours, 0);

    let stockoutRisk, confidence;
    if (hoursToStockout < 48) { stockoutRisk = 0.95; confidence = 'high'; }
    else if (hoursToStockout < 96) { stockoutRisk = 0.65; confidence = 'medium'; }
    else if (hoursToStockout < 144) { stockoutRisk = 0.35; confidence = 'medium'; }
    else { stockoutRisk = 0.10; confidence = 'low'; }

    // Scale by disruption risk factor
    stockoutRisk = Math.min(1, stockoutRisk * (1 + assessment.risk_factor));

    forecasts.push({
      sku_id: sku.id,
      sku_name: sku.name,
      stockout_risk: parseFloat(stockoutRisk.toFixed(3)),
      hours_to_stockout: parseFloat(hoursToStockout.toFixed(1)),
      confidence
    });
  }

  // Log
  const highRisk = forecasts.filter(f => f.stockout_risk > 0.5);
  await pool.query(
    `INSERT INTO decision_log (agent, event_type, input_summary, decision, predicted_outcome, autonomy_level, replay_phase)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      'inventory',
      'assess',
      `Lead time penalty: ${penaltyDays} days, risk factor: ${assessment.risk_factor}`,
      JSON.stringify(forecasts),
      `${highRisk.length} SKUs at high stockout risk`,
      'autonomous',
      replayPhase
    ]
  );

  broadcast(global.wss, 'inventory_forecast', { forecasts, high_risk_count: highRisk.length });

  console.log(`[Inventory] ${highRisk.length}/${forecasts.length} SKUs at high risk`);
  return { forecasts, highRisk };
}

module.exports = { process };
