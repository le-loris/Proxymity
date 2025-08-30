const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const ACTIVITY_LOG_PATH = path.join(__dirname, '.', 'db', 'activity.log');
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
  let nginxConfig = template
    .replace(/\$\{SERVICE_NAME\}/g, serviceName)
    .replace(/\$\{DOMAIN\}/g, config.domain || '')
    .replace(/\$\{SUBDOMAIN\}/g, subdomain)
    .replace(/\$\{PORT\}/g, portStr)
    .replace(/\$\{IP\}/g, config.ip || '')
    .replace(/\$\{HTTPS\}/g, https);
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

async function execute(configJson, templatesJson, defaultsJson, templateDir, archiveDir, outputDir) {
  try {
    const configData = loadConfig(configJson);
    const templatesMeta = loadConfig(templatesJson);
    const defaults = loadConfig(defaultsJson);
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
        const nginxConf = generateNginxConfig(serviceName, finalConfig, templateDir, templatesMeta);
        const group = finalConfig.group || 'None';
        const outputFilename = `${serviceName}.conf`;
        const outputPath = path.join(outputDir, outputFilename);
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(outputPath, nginxConf + '\n\n', 'utf8');
        console.log(`Configuration generated for ${serviceName} in ${outputFilename}`);
    }
  } catch (e) {
    console.error('Did not execute properly :', e);
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
    if (!fs.existsSync(dest)) {
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
  loadConfig,
  mergeDefaults,
  generateNginxConfig,
  backupAndClearConfs,
  execute
};