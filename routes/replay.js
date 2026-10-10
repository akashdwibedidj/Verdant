const router = require('express').Router();
const auth = require('../middleware/auth');
const replayEngine = require('../world/replayEngine');

router.post('/start', auth, async (req, res) => {
  try {
    const result = await replayEngine.start(global.wss);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/stop', auth, (req, res) => {
  replayEngine.stop();
  res.json({ stopped: true });
});

module.exports = router;
