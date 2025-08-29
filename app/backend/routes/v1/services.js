const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const SERVICES_PATH = path.join(__dirname, '../../db/services.json');
let servicesCache = null;

function loadServices() {
  try {
    const raw = fs.readFileSync(SERVICES_PATH, 'utf8');
    servicesCache = JSON.parse(raw);
  } catch {
    servicesCache = {};
  }
}

// GET all services
router.get('/', (req, res) => {
  loadServices();
  res.json(servicesCache);
});

// PUT create new service
router.put('/', (req, res) => {
  loadServices();
  const { name, ...serviceData } = req.body;
  if (!name || servicesCache[name]) {
    return res.status(400).json({ success: false, error: 'Missing or duplicate name' });
  }
  servicesCache[name] = serviceData;
  fs.writeFile(SERVICES_PATH, JSON.stringify(servicesCache, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    res.json({ success: true, key: name });
  });
});

// GET specific service
router.get('/:key', (req, res) => {
  loadServices();
  const service = servicesCache[req.params.key];
  if (!service) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, key: req.params.key, service });
});

// POST edit specific service
router.post('/:key', (req, res) => {
  loadServices();
  if (!servicesCache[req.params.key]) return res.status(404).json({ success: false, error: 'Not found' });
  servicesCache[req.params.key] = { ...servicesCache[req.params.key], ...req.body };
  fs.writeFile(SERVICES_PATH, JSON.stringify(servicesCache, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    res.json({ success: true, key: req.params.key });
  });
});

// DELETE specific service
router.delete('/:key', (req, res) => {
  loadServices();
  if (!servicesCache[req.params.key]) return res.status(404).json({ success: false, error: 'Not found' });
  delete servicesCache[req.params.key];
  fs.writeFile(SERVICES_PATH, JSON.stringify(servicesCache, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    res.json({ success: true, key: req.params.key });
  });
});

module.exports = router;
