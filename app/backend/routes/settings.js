const express = require('express');
const Docker = require('dockerode');
const router = express.Router();

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Stockage temporaire du container de référence (en mémoire)
let containerName = null;
let action = 'default';
let webhookURL = '';
let notifierEnabled = false;
let notifierApiKey = '';
let nginxDir = '/';
const fs = require('fs');
const path = require('path');
const SETTINGS_PATH = path.join(__dirname, '..', 'db', 'settings.json');

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return;
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    if (!raw) return;
    const obj = JSON.parse(raw);
    console.log('Read settings:', obj, raw);
    // support both old 'reference*' keys and new keys
    if (obj.containerName !== undefined) containerName = obj.containerName;
    if (obj.action !== undefined) action = obj.action;
    if (obj.webhookURL !== undefined) webhookURL = obj.webhookURL;
    if (obj.nginxDir !== undefined) nginxDir = obj.nginxDir;
    if (obj.notifierEnabled !== undefined) notifierEnabled = !!obj.notifierEnabled;
    if (obj.notifierApiKey !== undefined) notifierApiKey = obj.notifierApiKey;
    console.log('Settings loaded:', { containerName, action, webhookURL, nginxDir, notifierEnabled, notifierApiKey });
    } catch (e) {
      // ignore errors and continue with defaults
      console.error('Failed to load settings:', e.message);
    }
}

function saveSettings() {
  try {
    const dir = path.dirname(SETTINGS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj = {
      containerName: containerName,
      action: action,
      webhookUrl: webhookURL,
      nginxDir: nginxDir || '',
      notifierEnabled: notifierEnabled,
      notifierApiKey: notifierApiKey || ''
    };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save settings:', e.message);
  }
}

// Load persisted settings at startup
loadSettings();

// GET /api/settings/status
router.get('/status', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    let refName = containerName;
    let refContainer = null;
    if (refName) {
      refContainer = containers.find(c => c.Names && c.Names.some(name => name.replace(/^\//, '') === refName));
    }
    if (!refContainer) {
      // Choix par défaut : premier container contenant 'nginx' dans le nom
      refContainer = containers.find(c => c.Names && c.Names.some(name => name.includes('nginx')));
      refName = refContainer ? refContainer.Names[0].replace(/^\//, '') : null;
    }
    let status = '?';
    let color = 'warning';
    if (refContainer) {
      if (refContainer.State === 'running') {
        status = 'running';
        color = 'success';
      } else {
        status = refContainer.State;
        color = 'error';
      }
    }
    res.json({
      running: status === 'running',
      status,
      color,
      containerName: refName || '?',
      action: action || 'default',
      webhookURL: webhookURL || '',
      nginxDir: nginxDir || '',
      notifierEnabled: !!notifierEnabled,
      notifierApiKey: notifierApiKey || ''
    });
  } catch (e) {
    res.status(500).json({ running: false, status: '?', color: 'warning', containerName: '?', action: action || 'default', error: e.message });
  }
});

// POST /api/settings/save
router.post('/save', async (req, res) => {
  const body = req.body || {};
  // support both underscored legacy keys and new keys
  const containerNameIn = body._containerName !== undefined ? body._containerName : body.containerName;
  const actionIn = body._action !== undefined ? body._action : body.action;
  const webhookIn = body._webhookUrl !== undefined ? body._webhookUrl : body.webhookUrl || body.webhookURL;
  const notifierIn = body._notifier !== undefined ? body._notifier : body.notifier;
  const nginxDirIn = body._nginxDir !== undefined ? body._nginxDir : body.nginxDir;
  if (containerNameIn !== undefined) containerName = containerNameIn;
  if (actionIn !== undefined) action = actionIn;
  if (webhookIn !== undefined) webhookURL = webhookIn;
  if (nginxDirIn !== undefined) nginxDir = nginxDirIn;
  if (notifierIn) {
    notifierEnabled = !!notifierIn.enabled;
    notifierApiKey = notifierIn.apiKey || '';
  }
  try {
    saveSettings();
  } catch (e) {
    // ignore
  }
  res.json({ success: true, containerName: containerName, action: action, webhookUrl: webhookURL, notifierEnabled, notifierApiKey: notifierEnabled ? '***' : '', nginxDir: nginxDir || '' });
});

// GET /api/settings/containers
router.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json({ containers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/settings/listdir?path=...
router.get('/listdir', async (req, res) => {
  try {
    const p = req.query.path;
    if (!p) return res.json({ entries: [] });
    // Basic safety: do not allow parent traversal outside repo root (optional)
    // Resolve and list
    const resolved = path.resolve(p);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) return res.json({ entries: [] });
    const items = fs.readdirSync(resolved).map(name => ({ name, isDir: fs.statSync(path.join(resolved, name)).isDirectory() }));
    res.json({ entries: items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
