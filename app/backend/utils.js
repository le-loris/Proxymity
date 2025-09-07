const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const ACTIVITY_LOG_PATH = path.join(__dirname, '.', 'db', 'activity.log');
const DEFAULTS_PATH = path.join(__dirname, '.', 'db', 'defaults.json');
const SERVICES_PATH = path.join(__dirname, '.', 'db', 'services.json');
const TEMPLATES_META_PATH = path.join(__dirname, '.', 'db', 'templates.json');
const TEMPLATES_PATH = path.join(__dirname, '.', 'db', 'templates');
const SETTINGS_PATH = path.join(__dirname, '.', 'db', 'settings.json');
const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });


// --- Generator helpers ---
function loadConfig(jsonFile) {
  const text = fs.readFileSync(jsonFile, 'utf8');
  return JSON.parse(text);
}

function mergeDefaults(defaults, serviceData) {
  const result = { ...defaults };
  for (const key of Object.keys(serviceData)) {
    const val = serviceData[key];
    if (val === undefined || val === null || val === '') {
      // keep default
    } else {
      result[key] = val;
    }
  }
  return result;
}

function generateNginxConfig(serviceName, config, templateDir, templatesMeta) {
  if (!config.model) {
    throw new Error(`Template not provided for '${serviceName} or in Defaults.'`);
  }
  const authMethod = config.model;
  let templateName = `${authMethod}.conf`;
  if (templatesMeta && templatesMeta[authMethod] && templatesMeta[authMethod].file) {
    templateName = templatesMeta[authMethod].file;
  }
  const templatePath = path.join(templateDir, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template '${templateName}' not found in '${templateDir}'`);
  }
  const template = fs.readFileSync(templatePath, 'utf8');
  const portStr = config.port ? `:${config.port}` : '';
  const subdomain = (config.subdomain === undefined || config.subdomain === null || config.subdomain === 'None') ? '' : (config.subdomain === '' ? '' : config.subdomain + '.');
  const https = config.https ? 'https' : 'http';
  const cert = config.cert ? `ssl_certificate \t\t\"conf.d/ssl/${config.cert}.crt\"` : '';
  const key = config.cert ? `ssl_certificate_key \t\"conf.d/ssl/${config.cert}.key\"` : '';
  let nginxConfig = template
    .replace(/\$\{SERVICE_NAME\}/g, serviceName)
    .replace(/\$\{DOMAIN\}/g, config.domain || '')
    .replace(/\$\{SUBDOMAIN\}/g, subdomain)
    .replace(/\$\{PORT\}/g, portStr)
    .replace(/\$\{IP\}/g, config.ip || '')
    .replace(/\$\{HTTPS\}/g, https)
    .replace(/\$\{CERT\}/g, cert)
    .replace(/\$\{KEY\}/g, key);
  return nginxConfig;
}

async function backupAndClearConfs(configData, outputDir, archiveDir) {
  if (!fs.existsSync(archiveDir)) return;
  const confFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.conf'));
  if (!confFiles.length) return;
  const now = new Date().toISOString().replace(/[:T.-]/g, '_').slice(0, 19);
  fs.mkdirSync(archiveDir, { recursive: true });
  const zipName = `conf_${now}.zip`;
  const zipPath = path.join(archiveDir, zipName);
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));
    archive.pipe(output);
    confFiles.forEach((confFile) => {
      const confPath = path.join(outputDir, confFile);
      archive.file(confPath, { name: confFile });
    });
    archive.finalize();
  });
  for (const confFile of confFiles) {
    const service = path.basename(confFile, '.conf');
    const svc = configData[service];
    const isManual = svc && typeof svc.manual !== 'undefined' ? svc.manual : (configData.Defaults && configData.Defaults.manual);
    if (!isManual) {
      try { fs.unlinkSync(path.join(outputDir, confFile)); } catch (e) { /* ignore */ }
    }
  }
}

// Helper: run the backend generator and return generated files info
async function runDefaultExport() {
  console.log('[export] default export mode - running generator');
  // Use nginxDir from settings as root for output and archive when available
  const settings = loadConfig(SETTINGS_PATH);
  const nginxRoot = settings.nginxDir;
  const archiveDir = path.join(nginxRoot, 'backup');
  const outputDir = nginxRoot;
  const certsDir = path.join(nginxRoot, 'ssl');
  console.log("Parameters:", { nginxRoot, archiveDir, outputDir, certsDir });
  
  await execute(archiveDir, outputDir, certsDir);
  const files = fs.existsSync(outputDir) ? fs.readdirSync(outputDir).filter(f => f.endsWith('.conf')) : [];
  
  return { generated: files.length, files, outputDir };
}

// Test nginx config and restart container if valid
async function testAndRestartNginx(containerName) {
  if (!containerName) {
    return { nginxTest: 'No containerName set in settings.', nginxRestarted: false };
  }
  try {
    const container = docker.getContainer(containerName);
    // Run nginx -t inside the container
    const exec = await container.exec({
      Cmd: ['nginx', '-t'],
      AttachStdout: true,
      AttachStderr: true
    });
    const stream = await exec.start({ hijack: true, stdin: false });
    let output = '';
    await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => { output += chunk.toString(); });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    if (/syntax is ok/i.test(output) && /test is successful/i.test(output)) {
      await container.restart();
      return { nginxTest: output, nginxRestarted: true };
    } else {
      return { nginxTest: output, nginxRestarted: false };
    }
  } catch (nginxErr) {
    return { nginxTest: 'Error: ' + (nginxErr.message || nginxErr), nginxRestarted: false };
  }
}

async function callWebhook(url, config) {
  try {
  console.log('[export] callWebhook ->', url, config);
  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
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
    const resp = await fetch('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: { 'Access-Token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'note', title, body })
    });
    if (resp.status < 200 || resp.status >= 300) throw new Error('Pushbullet notification failed: ' + resp.status);
    try {
      return JSON.parse(resp.body || '{}');
    } catch (e) {
      return { raw: resp.body };
    }
  } catch (e) {
    console.error('[export] sendPushbulletNotification error', e);
    throw e;
  }
}

async function exportHandler(reqBody) {
  let time = new Date().toISOString();
  const settings = loadConfig(SETTINGS_PATH);
  const config = reqBody || {};
  let result = {};
  console.log('[export] launch requested', { time: time, settings: { action: settings.action, webhookURL: settings.webhookUrl, notifierEnabled: !!settings.notifierEnabled }, config });
  try {
    if (settings.action === 'webhook' && settings.webhookUrl) {
      console.log('[export] calling webhook', settings.webhookUrl);
      const webhookRes = await callWebhook(settings.webhookUrl, config);
      logActivity({
        type: 'export',
        target: 'webhook',
        name: settings.webhookUrl,
        details: { config },
        result: webhookRes
      });
      console.log('[export] webhook response', webhookRes);
      result.webhook = webhookRes;
    } else {
      // default: run the generator to produce .conf files (delegated to helper)
      try {
        const exportRes = await runDefaultExport();
        result.default = exportRes;
        logActivity({
          type: 'export',
          target: 'generator',
          name: 'runDefaultExport',
          details: {},
          result: exportRes
        });
        // Step: test nginx config and restart container if valid
        const { nginxTest, nginxRestarted } = await testAndRestartNginx(settings.containerName);
        result.nginxTest = nginxTest;
        result.nginxRestarted = nginxRestarted;
        logActivity({
          type: 'nginx',
          target: 'container',
          name: settings.containerName,
          details: { test: nginxTest },
          result: { restarted: nginxRestarted }
        });
        console.log('[export] nginx test result', nginxTest, 'restarted:', nginxRestarted);
      } catch (genErr) {
        logActivity({
          type: 'error',
          target: 'generator',
          name: 'runDefaultExport',
          details: {},
          result: { error: genErr.message || String(genErr) }
        });
        console.error('[export] generator error', genErr);
        throw genErr;
      }
    }
    //exportState.status = 'success';
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
        logActivity({
          type: 'notification',
          target: 'pushbullet',
          name: 'Export completed',
          details: {},
          result: notifRes
        });
        console.log('[export] notification response', notifRes);
        result.notification = 'Notification sent';
      } catch (notifErr) {
        logActivity({
          type: 'error',
          target: 'pushbullet',
          name: 'Export notification',
          details: {},
          result: { error: notifErr.message || String(notifErr) }
        });
        console.error('[export] notification failed', notifErr);
        result.notification = 'Notification failed: ' + notifErr.message;
      }
    }
    return { success: true, ...result };
  } catch (e) {
    logActivity({
      type: 'error',
      target: 'export',
      name: 'launch',
      details: {},
      result: { error: e.message || String(e) }
    });
    console.error('[export] error during export', e.message);
    return { success: false, error: e.message || String(e) };
  }
}

async function execute(archiveDir, outputDir, certsDir) {
  try {
    const configData = loadConfig(SERVICES_PATH);
    const templatesMeta = loadConfig(TEMPLATES_META_PATH);
    const defaults = loadConfig(DEFAULTS_PATH);
    await backupAndClearConfs(configData, outputDir, archiveDir);
    for (const [serviceName, serviceData] of Object.entries(configData)) {
      const manual = (typeof serviceData.manual !== 'undefined') ? serviceData.manual : (defaults && defaults.manual);
      const enabled = (typeof serviceData.enabled !== 'undefined') ? serviceData.enabled : (defaults && defaults.enabled);
      if (!enabled) {
        console.log(`${serviceName} is not enabled. Skipping.`);
        continue;
      }
      if (manual) {
        console.log(`${serviceName} is marked as manual. Skipping.`);
        continue;
      }
      const finalConfig = mergeDefaults(defaults, serviceData);
      console.log(`Generating configuration for ${serviceName} : `, finalConfig, defaults);
      if (!finalConfig.model) {
        console.log(`${serviceName} has no template/model defined. Skipping.`);
        continue;
      }
      const nginxConf = generateNginxConfig(serviceName, finalConfig, TEMPLATES_PATH, templatesMeta);
      const outputFilename = `${serviceName}.conf`;
      const outputPath = path.join(outputDir, outputFilename);
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(outputPath, nginxConf + '\n\n', 'utf8');
      console.log(`Configuration generated for ${serviceName} in ${outputFilename}`);
    }
  } catch (e) {
    console.error('Did not execute configuration sync properly :', e);
    throw e;
  }

  // --- Certificate sync ---
  try {
    const certsDbPath = path.join(__dirname, '.', 'db', 'certs.json');
    if (!fs.existsSync(certsDbPath)) {
      console.log('No certs.json found, skipping certificate sync.');
      return;
    }
    const certsData = loadConfig(certsDbPath);
    fs.mkdirSync(certsDir, { recursive: true });
    for (const [certName, certObj] of Object.entries(certsData)) {
      const dbCertsDir = path.join(__dirname, '.', 'db', 'certs');
      const srcCrtPath = path.join(dbCertsDir, `${certName}.crt`);
      const srcKeyPath = path.join(dbCertsDir, `${certName}.key`);
      const crtPath = path.join(certsDir, `${certName}.crt`);
      const keyPath = path.join(certsDir, `${certName}.key`);
      
      // Copy certificate and key files from db/certs/certPath and keyPath
      if (!fs.existsSync(srcCrtPath) || !fs.existsSync(srcKeyPath)) {
        console.log(`Certificate ${certName} source files not found. Skipping.`);
        continue;
      }
      fs.mkdirSync(certsDir, { recursive: true });
      fs.copyFileSync(srcCrtPath, crtPath);
      fs.copyFileSync(srcKeyPath, keyPath);
      console.log(`Certificate files copied for ${certName}`);
    }
  } catch (e) {
    console.error('Did not execute certificates sync properly :', e);
    throw e;
  }
}

function syncDbDefaults() {
  const dbDefaultDir = path.join(__dirname, '.', 'db-default');
  const dbDir = path.join(__dirname, '.', 'db');
  if (!fs.existsSync(dbDefaultDir)) {
    console.log('[syncDbDefaults] db-default directory not found:', dbDefaultDir);
    return;
  }

  const items = fs.readdirSync(dbDefaultDir);
  items.forEach(item => {
    const src = path.join(dbDefaultDir, item);
    const dest = path.join(dbDir, item);
    if (!fs.existsSync(dest) || item === 'fields.json') {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        fs.mkdirSync(dest);
        console.log(`[syncDbDefaults] Created directory: ${dest}`);
        // Optionally, copy files inside the directory (non-recursive)
        fs.readdirSync(src).forEach(f => {
          const srcFile = path.join(src, f);
          const destFile = path.join(dest, f);
          if (fs.statSync(srcFile).isFile()) {
            fs.copyFileSync(srcFile, destFile);
            console.log(`[syncDbDefaults] Copied file: ${srcFile} -> ${destFile}`);
          }
        });
      } else if (stat.isFile()) {
        fs.copyFileSync(src, dest);
        console.log(`[syncDbDefaults] Copied file: ${src} -> ${dest}`);
      }
    } else {
      console.log(`[syncDbDefaults] Exists, skipped: ${dest}`);
    }
  });
}

function logActivity({ type, target, name, details, result }) {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    target,
    name,
    details,
    result
  };
  try {
    fs.appendFileSync(ACTIVITY_LOG_PATH, JSON.stringify(entry) + '\n', 'utf8');
  } catch (e) {
    console.error('[logActivity] Failed to write log:', e);
  }
}

module.exports = {
  syncDbDefaults,
  logActivity,
  ACTIVITY_LOG_PATH,
  //loadConfig,
  //mergeDefaults,
  //generateNginxConfig,
  //backupAndClearConfs,
  //execute,
  //runDefaultExport
  exportHandler
};