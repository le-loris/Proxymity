const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const { ACTIVITY_LOG_PATH } = require('./utils');
const services = require(path.join(__dirname, '..', 'db', 'services.json'));
const templates = require(path.join(__dirname, '..', 'db', 'templates.json'));
const defaults = require(path.join(__dirname, '..', 'db', 'defaults.json'));
const fields = require(path.join(__dirname, '..', 'db', 'fields.json'));


router.get('/defaults', (req, res) => {
  res.json(defaults);
});

router.get('/fields', (req, res) => {
  res.json(fields);
});

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


router.get('/activity', (req, res) => {
  try {
    if (!fs.existsSync(ACTIVITY_LOG_PATH)) return res.json([]);
    const lines = fs.readFileSync(ACTIVITY_LOG_PATH, 'utf8').split('\n').filter(Boolean);
    const entries = lines.map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
    res.json(entries);
  } catch (e) {
    console.error('[meta/activity] error:', e);
    res.status(500).json({ error: 'Failed to read activity log', details: e.message });
  }
});

module.exports = router;
