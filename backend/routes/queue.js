const express = require('express');
const router = express.Router();
const { getQueue, getStats, removePatient } = require('../utils/queueManager');

router.get('/', (_req, res) => {
  res.json({ queue: getQueue(), stats: getStats() });
});

router.delete('/:token', (req, res) => {
  const token = parseInt(req.params.token, 10);
  removePatient(token);
  req.io.emit('queue:update', getQueue());
  req.io.emit('stats:update', getStats());
  res.json({ success: true, stats: getStats() });
});

module.exports = router;
const token = addPatient({
  disease: topMatch.name,
  priority: topMatch.tier
});