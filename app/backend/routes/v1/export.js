const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { runExport } = require('../../utils');

// PUT /api/v1/export: launch export
router.put('/', async (req, res) => {
  try {
    const result = await runExport(req.body || {});
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const ACTIVITY_LOG_PATH = path.join(__dirname, '..', 'db', 'activity.log');
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(ACTIVITY_LOG_PATH)) return res.json([]);
    const lines = fs.readFileSync(ACTIVITY_LOG_PATH, 'utf8').trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const event = JSON.parse(lines[i]);
        if (event && event.type === 'export') {
          return res.json(event);
        }
      } catch {}
    }
    res.json(null);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read export events' });
  }
});

module.exports = router;
