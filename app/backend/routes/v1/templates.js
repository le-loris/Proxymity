const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const TEMPLATES_PATH = path.join(__dirname, '../../db/templates.json');
let templatesContent  = {};

function loadTemplates() {
  try {
    const rawTemplates = require(TEMPLATES_PATH);
    templatesContent = {};
    Object.entries(rawTemplates).forEach(([name, tpl]) => {
      let text = '';
      try {
        text = fs.readFileSync(path.join(__dirname, '../../db/templates', name + '.conf'), 'utf8');
      } catch {}
      templatesContent[name] = { description: tpl.description || '', text };
    });
  } catch {
    templatesContent = {};
  }
}

// GET all templates
router.get('/', (req, res) => {
  loadTemplates();
  res.json(templatesContent);
});

// PUT create new template
router.put('/', (req, res) => {
  loadTemplates();
  const { name, description, text } = req.body;
  if (!name || templatesContent[name]) {
    return res.status(400).json({ success: false, error: 'Missing or duplicate name' });
  }
  // Only store description in templates.json
  const metaTemplates = { ...templatesContent };
  Object.keys(metaTemplates).forEach(k => { delete metaTemplates[k].text; });
  metaTemplates[name] = { description: description || '' };
  fs.writeFile(TEMPLATES_PATH, JSON.stringify(metaTemplates, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    // Write the template text to '[name].conf'
    if (typeof text === 'string') {
      fs.writeFile(path.join(__dirname, '../../db/templates', name + '.conf'), text, confErr => {
        if (confErr) return res.status(500).json({ success: false, error: 'Write error (conf)' });
        res.json({ success: true, key: name });
      });
    } else {
      res.json({ success: true, key: name });
    }
  });
});

// GET specific template
router.get('/:key', (req, res) => {
  loadTemplates();
  const template = templatesContent[req.params.key];
  console.log("TEMPLATES GET KEY", templatesContent)
  if (!template) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, key: req.params.key, template });
});

// POST edit specific template
router.post('/:key', (req, res) => {
  loadTemplates();
  const key = req.params.key;
  if (!templatesContent[key]) return res.status(404).json({ success: false, error: 'Not found' });
  const { description, text } = req.body;
  // Only store description in templates.json
  const metaTemplates = { ...templatesContent };
  Object.keys(metaTemplates).forEach(k => { delete metaTemplates[k].text; });
  metaTemplates[key] = { description: description || '' };
  fs.writeFile(TEMPLATES_PATH, JSON.stringify(metaTemplates, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    // Write the template text to '[name].conf'
    if (typeof text === 'string') {
      fs.writeFile(path.join(__dirname, '../../db/templates', key + '.conf'), text, confErr => {
        if (confErr) return res.status(500).json({ success: false, error: 'Write error (conf)' });
        res.json({ success: true, key });
      });
    } else {
      res.json({ success: true, key });
    }
  });
});

// DELETE specific template
router.delete('/:key', (req, res) => {
  loadTemplates();
  console.log("TEMPLATES DELETE", templatesContent)
  if (!templatesContent[req.params.key]) return res.status(404).json({ success: false, error: 'Not found' });
  delete templatesContent[req.params.key];
  fs.writeFile(TEMPLATES_PATH, JSON.stringify(templatesContent, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    res.json({ success: true, key: req.params.key });
  });
});

module.exports = router;
