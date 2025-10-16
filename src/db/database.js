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

  // Create api_keys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER
    )
  `);

  // Create email_verifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      verification_token TEXT UNIQUE NOT NULL,
      is_verified INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER NOT NULL
    )
  `);

  // Create indexes for api_keys and email_verifications
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_api_key ON api_keys(api_key);
    CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verifications(verification_token);
  `);

  // Migrate existing api_keys table to add expires_at column if it doesn't exist
  try {
    const columns = db.pragma('table_info(api_keys)');
    const hasExpiresAt = columns.some(col => col.name === 'expires_at');
    
    if (!hasExpiresAt) {
      console.log('Migrating api_keys table to add expires_at column...');
      db.exec(`ALTER TABLE api_keys ADD COLUMN expires_at INTEGER`);
      
      // Set expiration date for existing keys (365 days from created_at)
      db.exec(`
        UPDATE api_keys 
        SET expires_at = created_at + (365 * 24 * 60 * 60)
        WHERE expires_at IS NULL
      `);
      
      console.log('Migration completed successfully');
    }
  } catch (error) {
    console.error('Error during migration:', error);
  }

  console.log('Database initialized successfully');
}

module.exports = {
  db,
  initDatabase,
};
