const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const defaults = require('./defaults.json');
const fields = require('./fields.json');

const servicesPath = path.join(__dirname, 'services.json');
let services = require('./services.json');

const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir);
}
const templatesJsonPath = path.join(__dirname, 'templates.json');
let templatesMeta = {};
try {
  templatesMeta = require('./templates.json');
} catch (e) {
  templatesMeta = {};
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Sert les fichiers frontend
app.use(express.static(path.join(__dirname, 'public')));


// --- API TEMPLATES ---

// Liste tous les templates (lecture templates.json puis fichiers .conf)
app.get('/api/templates', (req, res) => {
  const entries = Object.entries(templatesMeta);
  if (entries.length === 0) return res.json([]);
  let count = entries.length;
  const templates = [];
  entries.forEach(([key, meta]) => {
    const file = meta.file || key + '.conf';
    fs.readFile(path.join(templatesDir, file), 'utf8', (err, text) => {
      templates.push({
        name: key,
        text: text || '',
        meta: { ...meta, file }
      });
      if (--count === 0) res.json(templates);
    });
  });
});

// Ajout d'un template
app.post('/api/templates/add', (req, res) => {
  const { name, text, meta = {} } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'Name and text required' });
  const filePath = path.join(templatesDir, name + '.conf');
  if (fs.existsSync(filePath)) return res.status(400).json({ error: 'Name already exists' });
  fs.writeFile(filePath, text, (err) => {
    if (err) return res.status(500).json({ error: 'Erreur écriture template' });
    templatesMeta[name] = meta;
    fs.writeFile(templatesJsonPath, JSON.stringify(templatesMeta, null, 2), (err2) => {
      if (err2) return res.status(500).json({ error: 'Erreur écriture templates.json' });
      res.json({ success: true });
    });
  });
});

// Edition d'un template (remplace le texte)
// Edition du texte ou du meta d'un template
app.post('/api/templates/edit/:name', (req, res) => {
  const { name } = req.params;
  const { text, meta } = req.body;
  const filePath = path.join(templatesDir, name + '.conf');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Template not found' });
  const doMeta = typeof meta !== 'undefined';
  const doText = typeof text !== 'undefined';
  if (!doMeta && !doText) return res.status(400).json({ error: 'Nothing to update' });
  const updateMeta = (cb) => {
    if (doMeta) {
      templatesMeta[name] = meta;
      fs.writeFile(templatesJsonPath, JSON.stringify(templatesMeta, null, 2), (err2) => {
        if (err2) return res.status(500).json({ error: 'Erreur écriture templates.json' });
        cb();
      });
    } else cb();
  };
  if (doText) {
    fs.writeFile(filePath, text, (err) => {
      if (err) return res.status(500).json({ error: 'Erreur écriture template' });
      updateMeta(() => res.json({ success: true }));
    });
  } else {
    updateMeta(() => res.json({ success: true }));
  }
});

// Suppression d'un template
app.delete('/api/templates/edit/:name', (req, res) => {
  const { name } = req.params;
  const filePath = path.join(templatesDir, name + '.conf');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Template not found' });
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Erreur suppression template' });
    delete templatesMeta[name];
    fs.writeFile(templatesJsonPath, JSON.stringify(templatesMeta, null, 2), (err2) => {
      if (err2) return res.status(500).json({ error: 'Erreur écriture templates.json' });
      res.json({ success: true });
    });
  });
});

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

// Suppression d'un service existant
app.delete('/api/services/edit/:name', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Serveur sur http://localhost:${PORT}`);
});
