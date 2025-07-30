const express = require('express');
const Docker = require('dockerode');
const router = express.Router();

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// GET /api/nginx/status
router.get('/status', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const nginx = containers.find(c =>
      (c.Names && c.Names.some(name => name.replace(/^\//, '') === 'proxymity-nginx')) ||
      (c.Names && c.Names.some(name => name.endsWith('/proxymity-nginx')))
    );
    res.json({ running: !!(nginx && nginx.State === 'running') });
  } catch (e) {
    res.status(500).json({ running: false, error: e.message });
  }
});

module.exports = router;
