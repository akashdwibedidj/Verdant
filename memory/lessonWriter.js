const pool = require('../db/client');
const memoryStore = require('./memoryStore');
const { broadcast } = require('../lib/broadcast');

// Called after each replay cycle completes
async function writeLessons(replayPhase) {
  console.log(`[LessonWriter] Writing lessons for phase ${replayPhase}`);

  // Get all decisions from this phase
  const res = await pool.query(
    `SELECT agent, event_type, input_summary, decision, predicted_outcome, cost_estimate, autonomy_level
     FROM decision_log
     WHERE replay_phase = $1
     ORDER BY timestamp ASC`,
    [replayPhase]
  );

  const decisions = res.rows;
  if (decisions.length === 0) return;

  // Group by agent, write one lesson per agent
  const agentGroups = {};
  for (const d of decisions) {
    if (!agentGroups[d.agent]) agentGroups[d.agent] = [];
    agentGroups[d.agent].push(d);
  }

  for (const [agent, agentDecisions] of Object.entries(agentGroups)) {
    const hitl = agentDecisions.filter(d => d.autonomy_level === 'hitl_required').length;
    const auto = agentDecisions.filter(d => d.autonomy_level === 'autonomous').length;
    const totalCost = agentDecisions.reduce((sum, d) => sum + parseFloat(d.cost_estimate || 0), 0);

    const situation = agentDecisions[0]?.input_summary || 'supply chain disruption';
    const lesson = `In phase ${replayPhase}: ${auto} autonomous actions, ${hitl} HITL escalations. Total estimated cost: $${totalCost.toFixed(0)}. Key action: ${agentDecisions[agentDecisions.length - 1]?.predicted_outcome || 'N/A'}`;

    // outcome_score = total cost (lower is better)
    const outcomeScore = totalCost;

    await memoryStore.writeLesson(agent, situation, lesson, replayPhase, outcomeScore);

    broadcast(global.wss, 'lesson_written', { agent, lesson, replay_phase: replayPhase });
    console.log(`[LessonWriter] ${agent}: ${lesson}`);
  }

  // Trigger champion/challenger evaluation every 3 phases
  if (replayPhase % 3 === 0) {
    const evaluator = require('./evaluator');
    await evaluator.evaluate(replayPhase);
  }
}

module.exports = { writeLessons };
