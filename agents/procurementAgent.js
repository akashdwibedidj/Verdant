const { callGemini, parseGeminiJSON } = require('../lib/gemini');
const { GeminiPlan } = require('../lib/schemas');
const { broadcast } = require('../lib/broadcast');
const pool = require('../db/client');
const worldModel = require('../world/worldModel');
const memoryStore = require('../memory/memoryStore');

async function process(forecasts, assessment, champion, replayPhase) {
  const highRiskSkus = forecasts.filter(f => f.stockout_risk > 0.5);
  if (highRiskSkus.length === 0) return null;

  const suppliers = worldModel.suppliers;
  const memories = await memoryStore.getSimilarLessons('procurement emergency PO supplier switch', 3);
  const memoryContext = memories.length
    ? memories.map(m => `- ${m.lesson}`).join('\n')
    : 'No past procurement lessons.';

  const systemPrompt = `You are a supply chain procurement agent.
Your job is to propose ONE procurement action to address stockout risk.
Past lessons:
${memoryContext}
Approved suppliers: ${JSON.stringify(suppliers.map(s => ({ id: s.id, name: s.name, region: s.region, lead_time_days: s.lead_time_days, cost_per_unit: s.cost_per_unit })))}
Output ONLY valid JSON:
{
  "action_type": "emergency_po" or "buffer_stock" or "supplier_switch",
  "cost_estimate": <number in USD>,
  "lead_time_days": <number>,
  "description": "brief description of action"
}`;

  const userMessage = `High risk SKUs: ${JSON.stringify(highRiskSkus)}\nRisk factor: ${assessment.risk_factor}`;

  let plan;
  try {
    const raw = await callGemini(systemPrompt, userMessage);
    const parsed = parseGeminiJSON(raw);
    plan = GeminiPlan.parse(parsed); // validate
  } catch (e) {
    console.error('[Procurement] Gemini/validation error, using fallback:', e.message);
    plan = {
      action_type: 'emergency_po',
      cost_estimate: 8500,
      lead_time_days: 10,
      description: 'Emergency PO to Mexican Alt Supplier for high-risk SKUs'
    };
  }

  // Autonomy rule — deterministic check
  const autonomyLevel = (plan.cost_estimate <= champion.budget_limit && assessment.risk_factor <= champion.alert_threshold)
    ? 'autonomous'
    : 'hitl_required';

  // Insert decision log
  const logRes = await pool.query(
    `INSERT INTO decision_log (agent, event_type, input_summary, decision, predicted_outcome, cost_estimate, autonomy_level, replay_phase)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      'procurement',
      autonomyLevel === 'autonomous' ? 'execute' : 'escalate',
      `${highRiskSkus.length} high-risk SKUs, risk_factor: ${assessment.risk_factor}`,
      JSON.stringify(plan),
      `Action: ${plan.action_type}, ETA: ${plan.lead_time_days} days`,
      plan.cost_estimate,
      autonomyLevel,
      replayPhase
    ]
  );

  // Create HITL card if needed
  if (autonomyLevel === 'hitl_required') {
    await pool.query(
      `INSERT INTO hitl_cards (decision_log_id, agent, action_type, description, cost_estimate, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [logRes.rows[0].id, 'procurement', plan.action_type, plan.description, plan.cost_estimate]
    );

    broadcast(global.wss, 'hitl_card', {
      agent: 'procurement',
      action_type: plan.action_type,
      description: plan.description,
      cost_estimate: plan.cost_estimate,
      reason: `Cost $${plan.cost_estimate} exceeds autonomous limit $${champion.budget_limit} OR risk ${assessment.risk_factor} > ${champion.alert_threshold}`
    });
    console.log(`[Procurement] HITL escalation: $${plan.cost_estimate}`);
  } else {
    console.log(`[Procurement] Autonomous action: ${plan.action_type} $${plan.cost_estimate}`);
  }

  broadcast(global.wss, 'agent_decision', {
    agent: 'procurement',
    decision: plan,
    autonomy_level: autonomyLevel
  });

  return { plan, autonomyLevel };
}

module.exports = { process };
