const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fields    = require(path.join(__dirname, '../../', 'db', 'fields.json'));
const defaults  = require(path.join(__dirname, '../../', 'db', 'defaults.json'));
const services  = require(path.join(__dirname, '../../', 'db', 'services.json'));
const templates = require(path.join(__dirname, '../../', 'db', 'templates.json'));
const { ACTIVITY_LOG_PATH, logActivity } = require('../../utils');

// GET/POST defaults
router.get('/defaults', (req, res) => {
    res.json(defaults);
    console.log("Defaults", defaults);
});
// router.post('/defaults', (req, res) => {
//   try {
//     setDefaults(req.body);
//     res.json({ success: true });
//   } catch (e) {
//     res.status(500).json({ success: false, error: e.message });
//   }
// });

// GET fields
router.get('/fields', (req, res) => {
    res.json(fields);
});

// GET activity log
router.get('/activity', (req, res) => {
  try {
    if (!fs.existsSync(ACTIVITY_LOG_PATH)) return res.json({ success: true, activity: [] });
    const lines = fs.readFileSync(ACTIVITY_LOG_PATH, 'utf8').split('\n').filter(Boolean);
    const entries = lines.map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
    res.json({ success: true, activity: entries });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// PUT activity log
router.put('/activity', (req, res) => {
  try {
    logActivity(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET stats
router.get('/stats', (req, res) => {
  try {
    const serviceList = Array.isArray(services) ? services : Object.values(services);
    const totalServices = serviceList.length;
    const enabledServices = serviceList.filter(s =>
      typeof s.enabled !== 'undefined' ? s.enabled : defaults.enabled
    ).length;

    const templateList = Array.isArray(templates) ? templates : Object.values(templates);
    const totalTemplates = templateList.length;

    const templatesWithServiceCount = templateList.map(template => {
      const serviceCount = Array.isArray(template.services) ? template.services.length : 0;
      return {
        ...template,
        serviceCount
      };
    });

    res.json({
      totalServices,
      enabledServices,
      totalTemplates,
      templates: templatesWithServiceCount
    });
  } catch (e) {
    console.error('[meta/stats] error:', e);
    res.status(500).json({ error: 'Failed to compute stats', details: e.message });
  }
});

module.exports = router;
