const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const servicesPath = path.join(__dirname, '..', 'db', 'services.json');
const defaults = require(path.join(__dirname, '..', 'db', 'defaults.json'));
const fields = require(path.join(__dirname, '..', 'db', 'fields.json'));
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
    res.json({ success: true, services });
  });
});

// Edition d'un service
router.post('/edit/:name', (req, res) => {
  const { name } = req.params;
  if (!services[name]) {
    return res.status(404).json({ error: 'Service non trouvé' });
  }
  services[name] = { ...services[name], ...req.body };
  fs.writeFile(servicesPath, JSON.stringify(services, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de l\'écriture du fichier' });
    }
    res.json({ success: true, services });
  });
});

// Suppression d'un service
router.delete('/edit/:name', (req, res) => {
  const { name } = req.params;
  if (!services[name]) {
    return res.status(404).json({ error: 'Service not found' });
  }
  delete services[name];
  fs.writeFile(servicesPath, JSON.stringify(services, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error writing file' });
    }
    res.json({ success: true, services });
  });
});

module.exports = router;
