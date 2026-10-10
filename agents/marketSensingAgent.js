const { callGemini, parseGeminiJSON } = require('../lib/gemini');
const { Event } = require('../lib/schemas');
const { broadcast } = require('../lib/broadcast');
const pool = require('../db/client');
const memoryStore = require('../memory/memoryStore');

async function process(rawEvent, replayPhase) {
  // 1. Validate event schema
  const event = Event.parse(rawEvent);

  // 2. Retrieve memory — similar past events
  const memories = await memoryStore.getSimilarLessons(
    `${event.type} at ${event.port} severity ${event.severity}`, 3
  );
  const memoryContext = memories.length
    ? memories.map(m => `- ${m.situation_summary}: ${m.lesson}`).join('\n')
    : 'No past similar events in memory.';

  // 3. Call Gemini
  const systemPrompt = `You are a supply chain market sensing agent.
Your job is to assess a disruption event and output a risk assessment.
Past lessons from memory:
${memoryContext}
Output ONLY valid JSON with this structure:
{
  "risk_factor": <number 0-1>,
  "lead_time_penalty_days": <number>,
  "affected_routes": ["route description"],
  "reasoning": "brief explanation"
}`;

  const userMessage = `Disruption event: ${JSON.stringify(event)}`;

  let assessment;
  try {
    const raw = await callGemini(systemPrompt, userMessage);
    assessment = parseGeminiJSON(raw);
  } catch (e) {
    console.error('[MarketSensing] Gemini parse error, using defaults:', e.message);
    assessment = {
      risk_factor: event.severity,
      lead_time_penalty_days: event.lead_time_penalty_days,
      affected_routes: [event.port],
      reasoning: 'Fallback: direct severity mapping'
    };
  }

  // 4. Log decision
  await pool.query(
    `INSERT INTO decision_log (agent, event_type, input_summary, decision, predicted_outcome, autonomy_level, replay_phase)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      'market_sensing',
      'detect',
      `${event.type} at ${event.port} (severity ${event.severity})`,
      JSON.stringify(assessment),
      `Lead time penalty: +${assessment.lead_time_penalty_days} days, risk: ${assessment.risk_factor}`,
      'autonomous',
      replayPhase
    ]
  );

  // 5. Broadcast to frontend
  broadcast(global.wss, 'market_assessment', {
    event,
    assessment,
    memory_used: memories.length
  });

  console.log(`[MarketSensing] Risk factor: ${assessment.risk_factor}, penalty: ${assessment.lead_time_penalty_days} days`);
  return { event, assessment };
}

module.exports = { process };
