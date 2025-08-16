const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const SETTINGS_PATH = path.join(__dirname, '..', 'db', 'settings.json');
const generator = require(path.join(__dirname, '..', 'generator'));

function httpRequest(urlStr, { method = 'GET', headers = {}, body = null, timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const lib = url.protocol === 'https:' ? https : http;
      const opts = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + (url.search || ''),
        method,
        headers,
      };

      const req = lib.request(opts, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(timeout, () => {
        req.destroy(new Error('Request timeout'));
      });

      if (body) {
        if (typeof body !== 'string') body = JSON.stringify(body);
        req.write(body);
      }
      req.end();
    } catch (e) {
      reject(e);
    }
});
}

// Simple in-memory export state
let exportState = {
  status: 'idle', // idle | running | success | error
  lastError: null,
  lastExport: null
};

function getSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return {};
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    console.log('[export] getSettings ->', SETTINGS_PATH, raw);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

// Helper: run the backend generator and return generated files info
async function runDefaultExport() {
  console.log('[export] default export mode - running generator');
  const configJson = path.join(__dirname, '..', 'db', 'services.json');
  const templatesJson = path.join(__dirname, '..', 'db', 'templates.json');
  const defaultsJson = path.join(__dirname, '..', 'db', 'defaults.json');
  const templateDir = path.join(__dirname, '..', 'templates');
  // Use nginxDir from settings as root for output and archive when available
  const settings = getSettings();
  const nginxRoot = (settings && settings.nginxDir) ? settings.nginxDir : path.join(__dirname, '..');
  const archiveDir = path.join(nginxRoot, 'sites-availables-backup');
  const outputDir = path.join(nginxRoot, 'sites-availables');

  // generator.execute signature: (configJson, templatesJson, defaultsJson, templateDir, archiveDir, outputDir)
  await generator.execute(configJson, templatesJson, defaultsJson, templateDir, archiveDir, outputDir);
  const files = fs.existsSync(outputDir) ? fs.readdirSync(outputDir).filter(f => f.endsWith('.conf')) : [];
  return { generated: files.length, files };
}

async function callWebhook(url, config) {
  try {
  console.log('[export] callWebhook ->', url, config);
  const resp = await httpRequest(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
    if (resp.status < 200 || resp.status >= 300) {
      const bodyPreview = (resp.body || '').substring(0, 200);
      const err = new Error('Webhook call failed: ' + resp.status + ' body=' + bodyPreview);
      err.status = resp.status;
      err.body = resp.body;
      throw err;
    }
    try { return JSON.parse(resp.body || '{}'); } catch (e) { return { raw: resp.body }; }
  } catch (e) {
  console.error('[export] callWebhook error', e);
    throw e;
  }
}

async function sendPushbulletNotification(apiKey, title, body) {
  try {
  console.log('[export] sendPushbulletNotification ->', { title, body: body && body.substring ? body.substring(0, 200) : body });
  const resp = await httpRequest('https://api.pushbullet.com/v2/pushes', { method: 'POST', headers: { 'Access-Token': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'note', title, body }) });
  if (resp.status < 200 || resp.status >= 300) throw new Error('Pushbullet notification failed: ' + resp.status);
  try { return JSON.parse(resp.body || '{}'); } catch (e) { return { raw: resp.body }; }
  } catch (e) {
  console.error('[export] sendPushbulletNotification error', e);
    throw e;
  }
}

router.post('/launch', async (req, res) => {
  exportState.status = 'running';
  exportState.lastError = null;
  exportState.lastExport = new Date().toISOString();
  const settings = getSettings();
  const config = req.body || {};
  let result = {};
  console.log('[export] launch requested', { time: exportState.lastExport, settings: { action: settings.action, webhookURL: settings.webhookURL, notifierEnabled: !!settings.notifierEnabled }, config });
  try {
    if (settings.action === 'webhook' && settings.webhookURL) {
      console.log('[export] calling webhook', settings.webhookURL);
      const webhookRes = await callWebhook(settings.webhookURL, config);
      console.log('[export] webhook response', webhookRes);
      result.webhook = webhookRes;
    } else {
      // default: run the generator to produce .conf files (delegated to helper)
      try {
        result.default = await runDefaultExport();
      } catch (genErr) {
        console.error('[export] generator error', genErr);
        throw genErr;
      }
    }
    exportState.status = 'success';
    console.log('[export] export succeeded');
    // Send notification if enabled
    if (settings.notifierEnabled && settings.notifierApiKey) {
      try {
        console.log('[export] sending pushbullet notification');
        const notifRes = await sendPushbulletNotification(
          settings.notifierApiKey,
          'Proxymity Export',
          'Export completed successfully.'
        );
        console.log('[export] notification response', notifRes);
        result.notification = 'Notification sent';
      } catch (notifErr) {
        console.error('[export] notification failed', notifErr);
        result.notification = 'Notification failed: ' + notifErr.message;
      }
    }
    res.json({ success: true, ...result });
  } catch (e) {
    exportState.status = 'error';
    exportState.lastError = e.stack || e.message || String(e);
    console.error('[export] error during export', exportState.lastError);
    res.status(500).json({ success: false, error: e.message || String(e) });
  }
});

router.get('/export/state', (req, res) => {
  res.json(exportState);
});

module.exports = router;
