const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const defaults = require('./defaults.json');
const fields = require('./fields.json');
const servicesPath = path.join(__dirname, 'services.json');
let services = require('./services.json');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Sert les fichiers frontend
app.use(express.static(path.join(__dirname, 'public')));


// Route API qui retourne le contenu de services.json
app.get('/api/services', (req, res) => {
  res.json(services);
});

// Route API qui retourne le contenu de defaults.json
app.get('/api/defaults', (req, res) => {
  res.json(defaults);
});

// Route API qui retourne le contenu de fields.json
app.get('/api/fields', (req, res) => {
  res.json(fields);
});

// Ajout d'un nouveau service
app.post('/api/services/add', (req, res) => {
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

// Modification d'un service existant
app.post('/api/services/edit/:name', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Serveur sur http://localhost:${PORT}`);
});
