const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const CERTS_PATH = path.join(__dirname, '../../db/certs.json');
const CERTS_DIR = path.join(__dirname, '../../db/certs');
let certsContent = {};

function loadCerts() {
  try {
    const raw = fs.readFileSync(CERTS_PATH, 'utf8');
    const rawCerts = JSON.parse(raw);
    certsContent = {};
    Object.entries(rawCerts).forEach(([name, data]) => {
      let cert = '', key = '';
      try {
        cert = fs.readFileSync(path.join(CERTS_DIR, name + '.crt'), 'utf8');
        key = fs.readFileSync(path.join(CERTS_DIR, name + '.key'), 'utf8');
      } catch {}
      
      certsContent[name] = { description: data.description || '', cert, key};
    });
  } catch {
    certsContent = {};
  }
}

// GET all certs
router.get('/', (req, res) => {
  loadCerts();
  res.json(certsContent);
});

// PUT create new cert
router.put('/', (req, res) => {
  loadCerts();
  const { name, description, cert, key } = req.body;
  if (!name || certsContent[name]) {
    return res.status(400).json({ success: false, error: 'Missing or duplicate name' });
  }
  // Only store description in certs.json
  const metaCerts = { ...certsContent };
  Object.keys(metaCerts).forEach(k => { delete metaCerts[k].cert; delete metaCerts[k].key; });
  metaCerts[name] = { description: description || '' };
  fs.writeFile(CERTS_PATH, JSON.stringify(metaCerts, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    // Write the cert text to '[name].crt'
    if (typeof cert === 'string') {
      fs.writeFile(path.join(CERTS_DIR, name + '.crt'), cert, certErr => {
        if (certErr) return res.status(500).json({ success: false, error: 'Write error (crt)' });
      });
      fs.writeFile(path.join(CERTS_DIR, name + '.key'), key || '', keyErr => {
        if (keyErr) return res.status(500).json({ success: false, error: 'Write error (key)' });
      });
      res.json({ success: true, key: name });
    } else {
      res.json({ success: true, key: name });
    }
  });
});

// GET specific cert
router.get('/:key', (req, res) => {
  loadCerts();
  const cert = certsContent[req.params.key];
  if (!cert) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, key: req.params.key, cert });
});

// POST edit specific cert
router.post('/:key', (req, res) => {
  loadCerts();
  const name = req.params.key;
  if (!certsContent[name]) return res.status(404).json({ success: false, error: 'Not found' });
  const { description, cert, key } = req.body;
  // Only store description in certs.json
  const metaCerts = { ...certsContent };
  Object.keys(metaCerts).forEach(k => { delete metaCerts[k].cert; delete metaCerts[k].key; });
  metaCerts[name] = { description: description || '' };
  fs.writeFile(CERTS_PATH, JSON.stringify(metaCerts, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    // Write the cert text to '[name].crt'
    if (typeof cert === 'string') {
      fs.writeFile(path.join(CERTS_DIR, name + '.crt'), cert, certErr => {
        if (certErr) return res.status(500).json({ success: false, error: 'Write error (crt)' });
        res.json({ success: true, key: name });
      });
      fs.writeFile(path.join(CERTS_DIR, name + '.key'), key || '', keyErr => {
        if (keyErr) return res.status(500).json({ success: false, error: 'Write error (key)' });
      });
    } else {
      res.json({ success: true, key: name });
    }
  });
});

// DELETE specific cert
router.delete('/:key', (req, res) => {
  loadCerts();
  if (!certsContent[req.params.key]) return res.status(404).json({ success: false, error: 'Not found' });
  delete certsContent[req.params.key];
  fs.writeFile(CERTS_PATH, JSON.stringify(certsContent, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    res.json({ success: true, key: req.params.key });
  });
});

module.exports = router;
