const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/lastheard.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema
function initDatabase() {
  // Check if old schema exists and needs migration
  let needsMigration = false;
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lastheard'").get();
    if (tables) {
      const columns = db.pragma('table_info(lastheard)');
      const columnNames = columns.map(col => col.name);
      
      // Check if old schema (has 'callsign', 'dmr_id', 'timestamp' fields)
      if (columnNames.includes('callsign') || columnNames.includes('dmr_id') || columnNames.includes('timestamp')) {
        needsMigration = true;
        console.log('Old lastheard table schema detected, migration needed...');
      }
    }
  } catch (error) {
    console.log('No existing lastheard table found, creating new schema...');
  }

  if (needsMigration) {
    // Rename old table
    db.exec(`ALTER TABLE lastheard RENAME TO lastheard_old`);
    
    // Drop old indexes
    db.exec(`DROP INDEX IF EXISTS idx_timestamp`);
    db.exec(`DROP INDEX IF EXISTS idx_dmr_id`);
    db.exec(`DROP INDEX IF EXISTS idx_talkgroup`);
    
    // Create new table with new schema
    db.exec(`
      CREATE TABLE lastheard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        SourceID INTEGER NOT NULL,
        DestinationID INTEGER NOT NULL,
        SourceCall TEXT NOT NULL,
        SourceName TEXT,
        DestinationCall TEXT,
        DestinationName TEXT,
        Start INTEGER NOT NULL,
        Stop INTEGER,
        TalkerAlias TEXT,
        duration INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Migrate data from old table to new table
    db.exec(`
      INSERT INTO lastheard (id, SourceID, DestinationID, SourceCall, Start, duration, created_at)
      SELECT id, dmr_id, talkgroup, callsign, timestamp, duration, created_at
      FROM lastheard_old
    `);
    
    // Drop old table
    db.exec(`DROP TABLE lastheard_old`);
    
    console.log('Migration completed successfully');
  } else {
    // Create lastheard table with new schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS lastheard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        SourceID INTEGER NOT NULL,
        DestinationID INTEGER NOT NULL,
        SourceCall TEXT NOT NULL,
        SourceName TEXT,
        DestinationCall TEXT,
        DestinationName TEXT,
        Start INTEGER NOT NULL,
        Stop INTEGER,
        TalkerAlias TEXT,
        duration INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  // Create index for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_start ON lastheard(Start DESC);
    CREATE INDEX IF NOT EXISTS idx_source_id ON lastheard(SourceID);
    CREATE INDEX IF NOT EXISTS idx_destination_id ON lastheard(DestinationID);
    CREATE INDEX IF NOT EXISTS idx_source_call ON lastheard(SourceCall);
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
