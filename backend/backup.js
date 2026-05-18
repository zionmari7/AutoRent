// backup.js — AutoRent daily database backup
// Run manually:    node backup.js
// Run via npm:     npm run backup
// Schedule daily:  0 2 * * * cd /path/to/backend && node backup.js >> logs/backup.log 2>&1
require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const DB_PATH     = process.env.DB_PATH || './autorent.db';
const BACKUP_DIR  = path.join(__dirname, 'backups');
const MAX_BACKUPS = 30;  // keep last 30 days

function run() {
  const dbFile = path.resolve(__dirname, DB_PATH);

  // Check the database file exists
  if (!fs.existsSync(dbFile)) {
    console.error(`[backup] ERROR: database not found at ${dbFile}`);
    process.exit(1);
  }

  // Create backups/ folder if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`[backup] Created folder: ${BACKUP_DIR}`);
  }

  // Build timestamped filename: autorent-2026-05-18T02-00-00.db
  const ts       = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const destFile = path.join(BACKUP_DIR, `autorent-${ts}.db`);

  // Copy the database file
  fs.copyFileSync(dbFile, destFile);
  const sizeMB = (fs.statSync(destFile).size / 1024 / 1024).toFixed(2);
  console.log(`[backup] ✅ Saved: ${path.basename(destFile)} (${sizeMB} MB)`);

  // Also copy WAL file if it exists (for a complete backup)
  const walFile = dbFile + '-wal';
  if (fs.existsSync(walFile)) {
    fs.copyFileSync(walFile, destFile + '-wal');
    console.log(`[backup] ✅ Saved WAL file too`);
  }

  // Prune old backups — keep only the most recent MAX_BACKUPS files
  const allBackups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('autorent-') && f.endsWith('.db'))
    .sort();  // ISO timestamps sort lexicographically = chronologically

  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(0, allBackups.length - MAX_BACKUPS);
    toDelete.forEach(f => {
      const full = path.join(BACKUP_DIR, f);
      fs.unlinkSync(full);
      // Also delete associated WAL if present
      if (fs.existsSync(full + '-wal')) fs.unlinkSync(full + '-wal');
      console.log(`[backup] 🗑  Pruned old backup: ${f}`);
    });
  }

  console.log(`[backup] Done. ${Math.min(allBackups.length, MAX_BACKUPS)} backup(s) kept.`);
}

run();
