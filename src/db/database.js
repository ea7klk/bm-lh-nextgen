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

  // Create indexes for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_start ON lastheard(Start DESC);
    CREATE INDEX IF NOT EXISTS idx_source_id ON lastheard(SourceID);
    CREATE INDEX IF NOT EXISTS idx_destination_id ON lastheard(DestinationID);
    CREATE INDEX IF NOT EXISTS idx_source_call ON lastheard(SourceCall);
  `);

  // Create talkgroups table
  db.exec(`
    CREATE TABLE IF NOT EXISTS talkgroups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talkgroup_id INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      continent TEXT,
      full_country_name TEXT,
      last_updated INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create index for talkgroups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_talkgroup_id ON talkgroups(talkgroup_id);
    CREATE INDEX IF NOT EXISTS idx_country ON talkgroups(country);
    CREATE INDEX IF NOT EXISTS idx_continent ON talkgroups(continent);
  `);

  // Create users table for user registration
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      callsign TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      last_login_at INTEGER,
      locale TEXT DEFAULT 'en'
    )
  `);

  // Create user_verifications table for email verification during registration
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      callsign TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      verification_token TEXT UNIQUE NOT NULL,
      is_verified INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER NOT NULL,
      locale TEXT DEFAULT 'en'
    )
  `);

  // Create sessions table for user sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for users and sessions
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_user_callsign ON users(callsign);
    CREATE INDEX IF NOT EXISTS idx_user_verification_token ON user_verifications(verification_token);
    CREATE INDEX IF NOT EXISTS idx_session_token ON user_sessions(session_token);
  `);

  // Create password_reset_tokens table for password recovery
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reset_token TEXT UNIQUE NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create email_change_tokens table for email change verification
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_change_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      old_email TEXT NOT NULL,
      new_email TEXT NOT NULL,
      old_email_token TEXT UNIQUE NOT NULL,
      new_email_token TEXT UNIQUE,
      old_email_verified INTEGER DEFAULT 0,
      new_email_verified INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for password reset and email change tokens
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(reset_token);
    CREATE INDEX IF NOT EXISTS idx_old_email_token ON email_change_tokens(old_email_token);
    CREATE INDEX IF NOT EXISTS idx_new_email_token ON email_change_tokens(new_email_token);
  `);

  console.log('Database initialized successfully');
}

module.exports = {
  db,
  initDatabase,
};
