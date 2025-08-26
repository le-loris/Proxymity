const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { logActivity } = require('./utils');

const templatesDir = path.join(__dirname, '..', 'db', 'templates');
const templatesJsonPath = path.join(__dirname, '..', 'db', 'templates.json');
let templatesMeta = {};
function readTemplatesFile(){
  try {
    templatesMeta = require(templatesJsonPath);
  } catch (e) {
    templatesMeta = {};
  }
}
readTemplatesFile();

// Liste tous les templates
router.get('/', (req, res) => {-
  readTemplatesFile();
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
router.post('/add', (req, res) => {
  const { name, text, meta = {} } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'Name and text required' });
  const filePath = path.join(templatesDir, name + '.conf');
  if (fs.existsSync(filePath)) return res.status(400).json({ error: 'Name already exists' });
  fs.writeFile(filePath, text, (err) => {
    if (err) return res.status(500).json({ error: 'Erreur écriture template' });
    templatesMeta[name] = meta;
    fs.writeFile(templatesJsonPath, JSON.stringify(templatesMeta, null, 2), (err2) => {
      if (err2) return res.status(500).json({ error: 'Erreur écriture templates.json' });
      logActivity({ type: 'template', target: 'add', name, details: { meta }, result: { success: true } });
      res.json({ success: true });
    });
  });
});

// Edition d'un template
router.post('/edit/:name', (req, res) => {
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
      updateMeta(() => {
        logActivity({ type: 'template', target: 'edit', name, details: { meta, text }, result: { success: true } });
        res.json({ success: true });
      });
    });
  } else {
    updateMeta(() => {
      logActivity({ type: 'template', target: 'edit', name, details: { meta }, result: { success: true } });
      res.json({ success: true });
    });
  }
});

// Suppression d'un template
router.delete('/edit/:name', (req, res) => {
  const { name } = req.params;
  const filePath = path.join(templatesDir, name + '.conf');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Template not found' });
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Erreur suppression template' });
    delete templatesMeta[name];
    fs.writeFile(templatesJsonPath, JSON.stringify(templatesMeta, null, 2), (err2) => {
      if (err2) return res.status(500).json({ error: 'Erreur écriture templates.json' });
      logActivity({ type: 'template', target: 'delete', name, details: {}, result: { success: true } });
      res.json({ success: true });
    });
  });
});

module.exports = router;
