const fs = require('fs');
const path = require('path');

function syncDbDefaults() {
  const dbDefaultDir = path.join(__dirname, '..', 'db-default');
  const dbDir = path.join(__dirname, '..', 'db');
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

module.exports = { syncDbDefaults };