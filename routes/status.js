const router = require('express').Router();
const auth = require('../middleware/auth');
const worldModel = require('../world/worldModel');

router.get('/', auth, (req, res) => {
  res.json(worldModel.snapshot());
});

module.exports = router;
