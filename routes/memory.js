const router = require('express').Router();
const auth = require('../middleware/auth');
const memoryStore = require('../memory/memoryStore');
const pool = require('../db/client');

// GET all lessons
router.get('/', auth, async (req, res) => {
  try {
    const lessons = await memoryStore.getAll();
    res.json(lessons);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET chart data: replay_phase vs average outcome_score (the "prove it" chart)
router.get('/chart', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT replay_phase, AVG(outcome_score) AS avg_score, COUNT(*) AS decisions
       FROM agent_memory
       WHERE outcome_score IS NOT NULL
       GROUP BY replay_phase
       ORDER BY replay_phase ASC`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET versions history (for champion/challenger audit)
router.get('/versions', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agent_versions ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
