const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const SETTINGS_PATH = path.join(__dirname, '../../db/settings.json');
let settingsCache = null;

// Load settings from file
function loadSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    settingsCache = JSON.parse(raw);
  } catch {
    settingsCache = {};
  }
}

// GET all settings
router.get('/', (req, res) => {
  loadSettings();
  res.json(settingsCache);
  console.log('[settings] GET', settingsCache);
});

// POST edit all settings
router.post('/', (req, res) => {
  fs.writeFile(SETTINGS_PATH, JSON.stringify(req.body, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    res.json({ success: true });
  });
  loadSettings();
});

// GET list_dirs
router.get('/list_dirs', (req, res) => {
  const dirPath = req.query.path;
  if (!dirPath) return res.status(400).json({ success: false, error: 'Missing path' });
  try {
    const files = fs.readdirSync(dirPath).map(name => ({
      name,
      isDir: fs.statSync(path.join(dirPath, name)).isDirectory()
    }));
    res.json({ success: true, files });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET containers

router.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json({ success: true, containers });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET container by id or name

router.get('/containers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const container = docker.getContainer(id);
    const info = await container.inspect();
    res.json({ success: true, container: info });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/v1/settings/status
router.get('/status', async (req, res) => {
  try {
    loadSettings();
    let containerName = settingsCache.containerName;
    
    const containers = await docker.listContainers({ all: true });

    let refContainer = null;
    if (containerName) {
      refContainer = containers.find(c => c.Names && c.Names.some(name => name.replace(/^\//, '') === containerName));
    }
    if (!refContainer) {
      // Default: autoselect first container with 'nginx' in the name
      refContainer = containers.find(c => c.Names && c.Names.some(name => name.includes('nginx')));
      containerName = refContainer ? refContainer.Names[0].replace(/^\//, '') : null;
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
      containerName: containerName || '?',
    });
  } catch (e) {
    res.status(500).json({ running: false, status: '?', color: 'warning', containerName: '?', error: e.message });
  }
});

// GET display mode
router.get('/display_mode', (req, res) => {
  loadSettings();
  const mode = settingsCache.display_mode || 'grid';
  res.json({ mode });
});

// POST display mode
router.post('/display_mode', (req, res) => {
  const { mode } = req.body;
  if (mode !== 'grid' && mode !== 'table') {
    return res.status(400).json({ success: false, error: 'Invalid mode' });
  }
  loadSettings();
  settingsCache.display_mode = mode;
  fs.writeFile(SETTINGS_PATH, JSON.stringify(settingsCache, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Write error' });
    res.json({ success: true, mode });
  });
});

module.exports = router;
