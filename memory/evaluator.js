const pool = require('../db/client');
const { broadcast } = require('../lib/broadcast');

// Run after every 3 replay phases — champion vs challenger
async function evaluate(replayPhase) {
  console.log(`[Evaluator] Running champion/challenger at phase ${replayPhase}`);

  // Get current champion
  const champRes = await pool.query('SELECT * FROM agent_versions WHERE is_champion = true LIMIT 1');
  const champion = champRes.rows[0];
  if (!champion) return;

  // Score champion: average outcome_score from memory for last 3 phases
  const champScore = await getAverageScore(replayPhase - 2, replayPhase);

  // Create challenger with mutated thresholds
  const newThreshold = parseFloat((champion.alert_threshold + (Math.random() * 0.1 - 0.05)).toFixed(3));
  const newBudget = champion.budget_limit + (Math.random() > 0.5 ? 1000 : -1000);
  const challengerTag = `v${replayPhase}-challenger`;

  // Score challenger: simulate by applying its thresholds to same phase decisions
  // (Simplified: challenger gets a score based on how many decisions would have been autonomous vs HITL)
  const decRes = await pool.query(
    `SELECT cost_estimate, autonomy_level FROM decision_log
     WHERE replay_phase BETWEEN $1 AND $2 AND cost_estimate IS NOT NULL`,
    [replayPhase - 2, replayPhase]
  );

  let challengerScore = 0;
  for (const d of decRes.rows) {
    const cost = parseFloat(d.cost_estimate || 0);
    // Challenger's score: sum of cost where it would have auto-acted
    if (cost <= newBudget) challengerScore += cost * 0.9; // 10% discount for faster execution
    else challengerScore += cost * 1.1; // HITL delay penalty
  }
  challengerScore = decRes.rows.length > 0 ? challengerScore / decRes.rows.length : 999;

  // Insert challenger version
  await pool.query(
    `INSERT INTO agent_versions (version_tag, alert_threshold, budget_limit, replay_score, is_champion)
     VALUES ($1, $2, $3, $4, false)`,
    [challengerTag, newThreshold, newBudget, challengerScore]
  );

  // Promote challenger if it wins (lower score = better)
  if (challengerScore < champScore) {
    await pool.query('UPDATE agent_versions SET is_champion = false WHERE is_champion = true');
    await pool.query('UPDATE agent_versions SET is_champion = true WHERE version_tag = $1', [challengerTag]);

    console.log(`[Evaluator] Challenger ${challengerTag} promoted! Score ${challengerScore.toFixed(2)} < ${champScore.toFixed(2)}`);
    broadcast(global.wss, 'champion_updated', {
      old_version: champion.version_tag,
      new_version: challengerTag,
      old_score: champScore,
      new_score: challengerScore,
      new_threshold: newThreshold,
      new_budget: newBudget
    });
  } else {
    console.log(`[Evaluator] Champion ${champion.version_tag} retained. Score ${champScore.toFixed(2)} <= ${challengerScore.toFixed(2)}`);
  }

  // Update champion's replay_score
  await pool.query('UPDATE agent_versions SET replay_score = $1 WHERE version_tag = $2', [champScore, champion.version_tag]);
}

async function getAverageScore(fromPhase, toPhase) {
  const res = await pool.query(
    `SELECT AVG(outcome_score) AS avg_score FROM agent_memory
     WHERE replay_phase BETWEEN $1 AND $2 AND outcome_score IS NOT NULL`,
    [fromPhase, toPhase]
  );
  return parseFloat(res.rows[0]?.avg_score || 999);
}

module.exports = { evaluate };
