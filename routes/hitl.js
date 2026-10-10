const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const pool = require('../db/client');
const { broadcast } = require('../lib/broadcast');

// GET all pending HITL cards
router.get('/pending', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, d.input_summary, d.replay_phase
       FROM hitl_cards h
       LEFT JOIN decision_log d ON h.decision_log_id = d.id
       WHERE h.status = 'pending'
       ORDER BY h.created_at DESC`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST approve
router.post('/:id/approve', auth, requireRole('administrator'), async (req, res) => {
  try {
    const { id } = req.params;
    const resolvedBy = req.user?.sub || req.user?.id || 'frontend_user';
    await pool.query(
      `UPDATE hitl_cards SET status = 'approved', resolved_at = NOW(), resolved_by = $1 WHERE id = $2 AND status = 'pending'`,
      [resolvedBy, id]
    );
    await pool.query(
      `UPDATE decision_log SET autonomy_level = 'hitl_approved' WHERE id = (SELECT decision_log_id FROM hitl_cards WHERE id = $1)`,
      [id]
    );
    broadcast(global.wss, 'hitl_resolved', { id, status: 'approved', resolved_by: resolvedBy });
    res.json({ approved: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST reject
router.post('/:id/reject', auth, requireRole('administrator'), async (req, res) => {
  try {
    const { id } = req.params;
    const resolvedBy = req.user?.sub || req.user?.id || 'frontend_user';
    await pool.query(
      `UPDATE hitl_cards SET status = 'rejected', resolved_at = NOW(), resolved_by = $1 WHERE id = $2 AND status = 'pending'`,
      [resolvedBy, id]
    );
    await pool.query(
      `UPDATE decision_log SET autonomy_level = 'hitl_rejected' WHERE id = (SELECT decision_log_id FROM hitl_cards WHERE id = $1)`,
      [id]
    );
    broadcast(global.wss, 'hitl_resolved', { id, status: 'rejected', resolved_by: resolvedBy });
    res.json({ rejected: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
