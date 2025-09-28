const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fields    = require(path.join(__dirname, '../../', 'db', 'fields.json'));
const DEFAULTS_PATH = path.join(__dirname, '../../db/defaults.json');
const defaults  = require(DEFAULTS_PATH);
const services  = require(path.join(__dirname, '../../', 'db', 'services.json'));
const templates = require(path.join(__dirname, '../../', 'db', 'templates.json'));
const { ACTIVITY_LOG_PATH, logActivity } = require('../../utils');

// GET defaults
router.get('/defaults', (req, res) => {
  const rawdata = fs.readFileSync(DEFAULTS_PATH, 'utf8');
  res.json(JSON.parse(rawdata));
  console.log("Defaults", JSON.parse(rawdata));
});

// POST defaults
router.post('/defaults', (req, res) => {
  try {
    const newDefaults = req.body;
    fs.writeFileSync(DEFAULTS_PATH, JSON.stringify(newDefaults, null, 2), 'utf8');
    // Reload and return updated defaults
    const updatedDefaults = JSON.parse(fs.readFileSync(DEFAULTS_PATH, 'utf8'));
    res.json({ success: true, defaults: updatedDefaults });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

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
    res.json(entries);
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

// POST /test: send notification via pushbullet or ntfy
router.post('/test-notifier', async (req, res) => {
  try {
    const { notifier, ...params } = req.body;
    let result;
    if (notifier === 'pushbullet') {
      // expects: apiKey, title, body
      const { pushBulletApiKey, title, body } = params;
      const { sendPushbulletNotification } = require('../../utils');
      result = await sendPushbulletNotification(pushBulletApiKey, title, body);
    } else if (notifier === 'ntfy') {
      const { ntfyServer, ntfyTopic, ntfyId, ntfyPassword, title, body } = params;
      const { sendNtfyNotification } = require('../../utils');
      result = await sendNtfyNotification(ntfyServer, ntfyTopic, ntfyId, ntfyPassword, title, body);
    } else {
      return res.status(400).json({ error: 'Unknown notifier type' });
    }
    res.json({ success: true, result });
  } catch (e) {
    console.error('[meta/test] error:', e);
    res.status(500).json({ error: 'Notification failed', details: e.message });
  }
});

module.exports = router;
