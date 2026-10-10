const { callGemini, parseGeminiJSON } = require('../lib/gemini');
const { broadcast } = require('../lib/broadcast');
const pool = require('../db/client');
const InventoryAgent = require('./inventoryAgent');
const ProcurementAgent = require('./procurementAgent');
const LogisticsAgent = require('./logisticsAgent');

async function getChampion() {
  const res = await pool.query('SELECT * FROM agent_versions WHERE is_champion = true LIMIT 1');
  return res.rows[0] || { alert_threshold: 0.15, budget_limit: 10000 };
}

async function process(marketResult, rawEvent, replayPhase) {
  const { event, assessment } = marketResult;
  const champion = await getChampion();

  // Run inventory, procurement, and logistics in parallel
  const [invResult, logResult] = await Promise.all([
    InventoryAgent.process(assessment, replayPhase),
    LogisticsAgent.process(event, assessment, champion, replayPhase)
  ]);

  // Procurement only if high risk SKUs exist
  let procResult = null;
  if (invResult.highRisk.length > 0) {
    procResult = await ProcurementAgent.process(invResult.forecasts, assessment, champion, replayPhase);
  }

  // Arbitrate with Gemini
  const proposals = {
    inventory_assessment: invResult.forecasts,
    logistics_proposal: logResult?.plan,
    procurement_proposal: procResult?.plan
  };

  const systemPrompt = `You are the supply chain meta-orchestrator.
Your job is to review agent proposals and produce a final arbitrated decision.
Working capital limit: $500,000
Current champion thresholds: alert=${champion.alert_threshold}, budget=$${champion.budget_limit}
Note: figures are illustrative, inspired by 2023-24 Panama Canal drought.
Output ONLY valid JSON:
{
  "final_decision": "brief description of what is approved and why",
  "total_cost": <number>,
  "lead_time_impact": "description",
  "confidence": "low|medium|high"
}`;

  const userMessage = `Agent proposals: ${JSON.stringify(proposals)}\nRisk factor: ${assessment.risk_factor}`;

  let arbitration;
  try {
    const raw = await callGemini(systemPrompt, userMessage);
    arbitration = parseGeminiJSON(raw);
  } catch (e) {
    console.error('[Orchestrator] Gemini error, using summary:', e.message);
    arbitration = {
      final_decision: `Logistics ${logResult?.autonomyLevel}, Procurement ${procResult?.autonomyLevel || 'not triggered'}`,
      total_cost: (logResult?.plan?.cost_estimate || 0) + (procResult?.plan?.cost_estimate || 0),
      lead_time_impact: `+${assessment.lead_time_penalty_days} days adjusted`,
      confidence: 'medium'
    };
  }

  // Log orchestrator decision
  await pool.query(
    `INSERT INTO decision_log (agent, event_type, input_summary, decision, predicted_outcome, cost_estimate, autonomy_level, replay_phase)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      'orchestrator',
      'execute',
      `Arbitrating ${Object.keys(proposals).length} proposals, risk: ${assessment.risk_factor}`,
      JSON.stringify(arbitration),
      arbitration.final_decision,
      arbitration.total_cost,
      'autonomous',
      replayPhase
    ]
  );

  broadcast(global.wss, 'orchestrator_decision', {
    arbitration,
    assessment,
    proposals,
    replay_phase: replayPhase
  });

  console.log(`[Orchestrator] Final decision: ${arbitration.final_decision}`);
  return arbitration;
}

module.exports = { process };
