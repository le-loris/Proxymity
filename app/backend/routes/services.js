const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { logActivity } = require('./utils');

const servicesPath = path.join(__dirname, '..', 'db', 'services.json');
const defaultsPath = path.join(__dirname, '..', 'db', 'defaults.json');
const fields = require(path.join(__dirname, '..', 'db', 'fields.json'));
let defaults = require(defaultsPath);
let services = require(servicesPath);

// Liste tous les services
router.get('/', (req, res) => {
  res.json(services);
});

// Defaults
router.get('/defaults', (req, res) => {
  res.json(defaults);
});

// Fields
router.get('/fields', (req, res) => {
  res.json(fields);
});

// Ajout d'un service
router.post('/add', (req, res) => {
  const { name, ...serviceData } = req.body;
  if (!name || services[name]) {
    return res.status(400).json({ error: 'Nom manquant ou déjà existant' });
  }
  services[name] = serviceData;
  fs.writeFile(servicesPath, JSON.stringify(services, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
    }
    logActivity({ type: 'service', target: 'add', name, details: { serviceData }, result: { success: true } });
    res.json({ success: true, services });
  });
});

// Edition d'un service
router.post('/edit/:name', (req, res) => {
  const { name } = req.params;
  // If editing Defaults, write defaults.json instead
  if (name === 'Defaults') {
    try {
      const body = req.body || {};
      // remove name if present
      if (body.name) delete body.name;
      fs.writeFileSync(defaultsPath, JSON.stringify(body, null, 2), 'utf8');
      logActivity({ type: 'service', target: 'edit', name: 'Defaults', details: { body }, result: { success: true } });
      return res.json({ success: true, services, defaults: body });
    } catch (e) {
      return res.status(500).json({ error: 'Erreur lors de l\'écriture des defaults' });
    }
  }

  if (!services[name]) {
    return res.status(404).json({ error: 'Service non trouvé' });
  }
  services[name] = { ...services[name], ...req.body };
  fs.writeFile(servicesPath, JSON.stringify(services, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
    }
    logActivity({ type: 'service', target: 'edit', name, details: { update: req.body }, result: { success: true } });
    res.json({ success: true, services });
  });
});

// Suppression d'un service
router.delete('/edit/:name', (req, res) => {
  const { name } = req.params;
  if (name === 'Defaults') {
    return res.status(400).json({ error: 'Cannot delete Defaults' });
  }
  if (!services[name]) {
    return res.status(404).json({ error: 'Service not found' });
  }
  delete services[name];
  fs.writeFile(servicesPath, JSON.stringify(services, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error writing file' });
    }
    logActivity({ type: 'service', target: 'delete', name, details: {}, result: { success: true } });
    res.json({ success: true, services });
  });
});

module.exports = router;
