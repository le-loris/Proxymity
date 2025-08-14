const express = require('express');
const Docker = require('dockerode');
const router = express.Router();

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Stockage temporaire du container de référence (en mémoire)
let referenceContainerName = null;
let referenceAction = 'default';
let referenceWebhookUrl = '';
let notifierEnabled = false;
let notifierApiKey = '';
const fs = require('fs');
const path = require('path');
const SETTINGS_PATH = path.join(__dirname, '..', 'db', 'settings.json');

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return;
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (obj.referenceContainerName !== undefined) referenceContainerName = obj.referenceContainerName;
    if (obj.referenceAction !== undefined) referenceAction = obj.referenceAction;
    if (obj.referenceWebhookUrl !== undefined) referenceWebhookUrl = obj.referenceWebhookUrl;
    if (obj.notifierEnabled !== undefined) notifierEnabled = !!obj.notifierEnabled;
    if (obj.notifierApiKey !== undefined) notifierApiKey = obj.notifierApiKey;
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
      referenceContainerName,
      referenceAction,
      referenceWebhookUrl,
      notifierEnabled,
      notifierApiKey
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
    let refName = referenceContainerName;
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
      action: referenceAction || 'default',
      webhookUrl: referenceWebhookUrl || '',
      notifierEnabled: !!notifierEnabled,
      notifierApiKey: notifierApiKey || ''
    });
  } catch (e) {
    res.status(500).json({ running: false, status: '?', color: 'warning', containerName: '?', action: referenceAction || 'default', error: e.message });
  }
});

// POST /api/settings/reference
router.post('/reference', async (req, res) => {
  const { containerName, action, webhookUrl } = req.body;
  if (!containerName) return res.status(400).json({ error: 'containerName required' });
  referenceContainerName = containerName;
  referenceAction = action || 'default';
  referenceWebhookUrl = webhookUrl || '';
  try {
    saveSettings();
  } catch (e) {
    // ignore
  }
  res.json({ success: true, containerName, action: referenceAction, webhookUrl: referenceWebhookUrl });
});

// POST /api/settings/save
+router.post('/save', async (req, res) => {
  const { containerName, action, webhookUrl, notifier } = req.body || {};
  if (containerName) referenceContainerName = containerName;
  if (action) referenceAction = action;
  if (webhookUrl !== undefined) referenceWebhookUrl = webhookUrl;
  if (notifier) {
    notifierEnabled = !!notifier.enabled;
    notifierApiKey = notifier.apiKey || '';
  }
  try {
    saveSettings();
  } catch (e) {
    // ignore
  }
  res.json({ success: true, containerName: referenceContainerName, action: referenceAction, webhookUrl: referenceWebhookUrl, notifierEnabled, notifierApiKey: notifierEnabled ? '***' : '' });
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

module.exports = router;
