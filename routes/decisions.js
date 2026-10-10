const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../db/client');

// GET all decisions (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const result = await pool.query(
      'SELECT * FROM decision_log ORDER BY timestamp DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({ page, limit, data: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
