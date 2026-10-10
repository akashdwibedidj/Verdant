const pool = require('../db/client');

// Write a lesson to memory
async function writeLesson(agent, situation, lesson, replayPhase, outcomeScore) {
  await pool.query(
    `INSERT INTO agent_memory (agent, situation_summary, lesson, replay_phase, outcome_score)
     VALUES ($1, $2, $3, $4, $5)`,
    [agent, situation, lesson, replayPhase, outcomeScore]
  );
}

// Retrieve similar lessons using full-text search (no pgvector needed)
async function getSimilarLessons(situation, topK = 3) {
  if (!situation || situation.trim() === '') return [];

  // Build tsquery from significant words
  const words = situation
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 8); // limit to 8 words

  if (words.length === 0) return [];

  const query = words.join(' | '); // OR search

  try {
    const res = await pool.query(
      `SELECT situation_summary, lesson, outcome_score, replay_phase
       FROM agent_memory
       WHERE search_vector @@ to_tsquery('english', $1)
       ORDER BY outcome_score ASC NULLS LAST, created_at DESC
       LIMIT $2`,
      [query, topK]
    );
    return res.rows;
  } catch (e) {
    // Fallback: return most recent lessons if search fails
    const res = await pool.query(
      `SELECT situation_summary, lesson, outcome_score, replay_phase
       FROM agent_memory
       ORDER BY created_at DESC
       LIMIT $1`,
      [topK]
    );
    return res.rows;
  }
}

async function getAll() {
  const res = await pool.query('SELECT * FROM agent_memory ORDER BY created_at DESC');
  return res.rows;
}

module.exports = { writeLesson, getSimilarLessons, getAll };
