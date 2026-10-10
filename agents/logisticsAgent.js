const { callGemini, parseGeminiJSON } = require('../lib/gemini');
const { GeminiPlan } = require('../lib/schemas');
const { broadcast } = require('../lib/broadcast');
const pool = require('../db/client');
const worldModel = require('../world/worldModel');
const memoryStore = require('../memory/memoryStore');

async function process(event, assessment, champion, replayPhase) {
  const routes = worldModel.routes;
  const ports = worldModel.ports;
  const memories = await memoryStore.getSimilarLessons(`reroute ${event.port} disruption`, 3);
  const memoryContext = memories.length
    ? memories.map(m => `- ${m.lesson}`).join('\n')
    : 'No past rerouting lessons.';

  const systemPrompt = `You are a supply chain logistics routing agent.
Your job is to propose the best rerouting action given a port disruption.
Past lessons:
${memoryContext}
Available ports: ${JSON.stringify(ports.map(p => ({ name: p.name, country: p.country, status: p.status })))}
Output ONLY valid JSON:
{
  "action_type": "reroute" or "supplier_switch",
  "cost_estimate": <number in USD>,
  "lead_time_days": <number>,
  "description": "brief description"
}`;

  const userMessage = `Disrupted port: ${event.port}. Severity: ${event.severity}. Risk factor: ${assessment.risk_factor}`;

  let plan;
  try {
    const raw = await callGemini(systemPrompt, userMessage);
    const parsed = parseGeminiJSON(raw);
    plan = GeminiPlan.parse(parsed);
  } catch (e) {
    console.error('[Logistics] Gemini/validation error, using fallback:', e.message);
    plan = {
      action_type: 'reroute',
      cost_estimate: 4500,
      lead_time_days: 3,
      description: 'Reroute via Port of Manzanillo Mexico to bypass Panama Canal disruption'
    };
  }

  const autonomyLevel = (plan.cost_estimate <= champion.budget_limit && assessment.risk_factor <= champion.alert_threshold)
    ? 'autonomous'
    : 'hitl_required';

  const logRes = await pool.query(
    `INSERT INTO decision_log (agent, event_type, input_summary, decision, predicted_outcome, cost_estimate, autonomy_level, replay_phase)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      'logistics',
      autonomyLevel === 'autonomous' ? 'execute' : 'escalate',
      `Port disruption at ${event.port}, severity: ${event.severity}`,
      JSON.stringify(plan),
      `Reroute via: ${plan.description}`,
      plan.cost_estimate,
      autonomyLevel,
      replayPhase
    ]
  );

  if (autonomyLevel === 'hitl_required') {
    await pool.query(
      `INSERT INTO hitl_cards (decision_log_id, agent, action_type, description, cost_estimate, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [logRes.rows[0].id, 'logistics', plan.action_type, plan.description, plan.cost_estimate]
    );

    broadcast(global.wss, 'hitl_card', {
      agent: 'logistics',
      action_type: plan.action_type,
      description: plan.description,
      cost_estimate: plan.cost_estimate,
      reason: `Requires human approval — cost or risk exceeds champion thresholds`
    });
  }

  broadcast(global.wss, 'agent_decision', {
    agent: 'logistics',
    decision: plan,
    autonomy_level: autonomyLevel
  });

  console.log(`[Logistics] ${autonomyLevel}: ${plan.action_type} $${plan.cost_estimate}`);
  return { plan, autonomyLevel };
}

module.exports = { process };
