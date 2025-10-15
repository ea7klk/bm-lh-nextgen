const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/lastheard.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema
function initDatabase() {
  // Create lastheard table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lastheard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      callsign TEXT NOT NULL,
      dmr_id INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      talkgroup INTEGER NOT NULL,
      timeslot INTEGER NOT NULL,
      duration INTEGER,
      reflector TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create index for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_timestamp ON lastheard(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_dmr_id ON lastheard(dmr_id);
    CREATE INDEX IF NOT EXISTS idx_talkgroup ON lastheard(talkgroup);
  `);

  console.log('Database initialized successfully');
}

module.exports = {
  db,
  initDatabase,
};
