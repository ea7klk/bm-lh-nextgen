const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');

// Check if we should use PostgreSQL or SQLite
const usePostgres = process.env.DB_HOST && process.env.DB_HOST !== '';

let db, pool, initDatabase;

if (usePostgres) {
  console.log('Using PostgreSQL database');
  
  // PostgreSQL connection configuration
  pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'bm_lh_user',
    password: process.env.DB_PASSWORD || 'changeme',
    database: process.env.DB_NAME || 'bm_lh_nextgen',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
  });

  // PostgreSQL-compatible database wrapper that mimics better-sqlite3 API
  db = {
    prepare: (sql) => {
      // Convert SQLite parameterized queries (?) to PostgreSQL ($1, $2, etc.)
      // Also handle column name quoting for PostgreSQL
      let paramCount = 0;
      let pgSql = sql.replace(/\?/g, () => `$${++paramCount}`);
      
      // Quote column names that contain capitals (PostgreSQL specific)
      const columnsToQuote = ['SourceID', 'DestinationID', 'SourceCall', 'SourceName', 'DestinationCall', 'DestinationName', 'Start', 'Stop', 'TalkerAlias'];
      columnsToQuote.forEach(col => {
        const regex = new RegExp(`\\b${col}\\b`, 'g');
        pgSql = pgSql.replace(regex, `"${col}"`);
      });
      
      return {
        get: async (...params) => {
          const result = await pool.query(pgSql, params);
          return result.rows[0];
        },
        all: async (...params) => {
          const result = await pool.query(pgSql, params);
          return result.rows;
        },
        run: async (...params) => {
          // For INSERT statements, we need to return the inserted row with RETURNING id
          let queryToRun = pgSql;
          if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
            queryToRun = pgSql + ' RETURNING id';
          }
          
          const result = await pool.query(queryToRun, params);
          return {
            changes: result.rowCount,
            lastInsertRowid: result.rows[0]?.id || null,
          };
        },
      };
    },
    exec: async (sql) => {
      // Quote column names for PostgreSQL
      let pgSql = sql;
      const columnsToQuote = ['SourceID', 'DestinationID', 'SourceCall', 'SourceName', 'DestinationCall', 'DestinationName', 'Start', 'Stop', 'TalkerAlias'];
      columnsToQuote.forEach(col => {
        const regex = new RegExp(`\\b${col}\\b`, 'g');
        pgSql = pgSql.replace(regex, `"${col}"`);
      });
      await pool.query(pgSql);
    },
  };

  // Initialize PostgreSQL database schema
  initDatabase = async function() {
    try {
      // Create lastheard table with PostgreSQL syntax
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lastheard (
          id SERIAL PRIMARY KEY,
          "SourceID" INTEGER NOT NULL,
          "DestinationID" INTEGER NOT NULL,
          "SourceCall" TEXT NOT NULL,
          "SourceName" TEXT,
          "DestinationCall" TEXT,
          "DestinationName" TEXT,
          "Start" BIGINT NOT NULL,
          "Stop" BIGINT,
          "TalkerAlias" TEXT,
          duration INTEGER,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
        )
      `);

      // Create indexes for faster queries
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_start ON lastheard("Start" DESC)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_source_id ON lastheard("SourceID")`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_destination_id ON lastheard("DestinationID")`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_source_call ON lastheard("SourceCall")`);

      // Create api_keys table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          api_key TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
          expires_at BIGINT,
          last_used_at BIGINT,
          locale TEXT DEFAULT 'en'
        )
      `);

      // Create email_verifications table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_verifications (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          name TEXT NOT NULL,
          verification_token TEXT UNIQUE NOT NULL,
          is_verified INTEGER DEFAULT 0,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
          expires_at BIGINT NOT NULL,
          locale TEXT DEFAULT 'en'
        )
      `);

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_api_key ON api_keys(api_key)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verifications(verification_token)`);

      // Create talkgroups table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS talkgroups (
          id SERIAL PRIMARY KEY,
          talkgroup_id INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          country TEXT NOT NULL,
          continent TEXT,
          full_country_name TEXT,
          last_updated BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
        )
      `);

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_talkgroup_id ON talkgroups(talkgroup_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_country ON talkgroups(country)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_continent ON talkgroups(continent)`);

      // Create users table for user registration
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          callsign TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_active INTEGER DEFAULT 0,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
          last_login_at BIGINT,
          locale TEXT DEFAULT 'en'
        )
      `);

      // Create user_verifications table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_verifications (
          id SERIAL PRIMARY KEY,
          callsign TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          verification_token TEXT UNIQUE NOT NULL,
          is_verified INTEGER DEFAULT 0,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
          expires_at BIGINT NOT NULL,
          locale TEXT DEFAULT 'en'
        )
      `);

      // Create user_sessions table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          session_token TEXT UNIQUE NOT NULL,
          user_id INTEGER NOT NULL,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
          expires_at BIGINT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_email ON users(email)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_callsign ON users(callsign)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_verification_token ON user_verifications(verification_token)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_session_token ON user_sessions(session_token)`);

      // Create password_reset_tokens table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          reset_token TEXT UNIQUE NOT NULL,
          is_used INTEGER DEFAULT 0,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
          expires_at BIGINT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create email_change_tokens table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_change_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          old_email TEXT NOT NULL,
          new_email TEXT NOT NULL,
          old_email_token TEXT UNIQUE NOT NULL,
          new_email_token TEXT UNIQUE,
          old_email_verified INTEGER DEFAULT 0,
          new_email_verified INTEGER DEFAULT 0,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
          expires_at BIGINT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(reset_token)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_old_email_token ON email_change_tokens(old_email_token)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_new_email_token ON email_change_tokens(new_email_token)`);

      console.log('PostgreSQL database initialized successfully');
    } catch (error) {
      console.error('Error initializing PostgreSQL database:', error);
      throw error;
    }
  };

} else {
  console.log('Using SQLite database');
  
  // SQLite database
  const dbPath = path.join(__dirname, '../../data/lastheard.db');
  const sqlite = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  sqlite.pragma('journal_mode = WAL');

  // Wrap SQLite methods to return promises for consistent API
  db = {
    prepare: (sql) => {
      const stmt = sqlite.prepare(sql);
      return {
        get: async (...params) => Promise.resolve(stmt.get(...params)),
        all: async (...params) => Promise.resolve(stmt.all(...params)),
        run: async (...params) => Promise.resolve(stmt.run(...params)),
      };
    },
    exec: async (sql) => Promise.resolve(sqlite.exec(sql)),
  };

  // Initialize SQLite database schema
  initDatabase = async function() {
    // Check if old schema exists and needs migration
    let needsMigration = false;
    try {
      const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lastheard'").get();
      if (tables) {
        const columns = sqlite.pragma('table_info(lastheard)');
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
      sqlite.exec(`ALTER TABLE lastheard RENAME TO lastheard_old`);
      
      // Drop old indexes
      sqlite.exec(`DROP INDEX IF EXISTS idx_timestamp`);
      sqlite.exec(`DROP INDEX IF EXISTS idx_dmr_id`);
      sqlite.exec(`DROP INDEX IF EXISTS idx_talkgroup`);
      
      // Create new table with new schema
      sqlite.exec(`
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
      sqlite.exec(`
        INSERT INTO lastheard (id, SourceID, DestinationID, SourceCall, Start, duration, created_at)
        SELECT id, dmr_id, talkgroup, callsign, timestamp, duration, created_at
        FROM lastheard_old
      `);
      
      // Drop old table
      sqlite.exec(`DROP TABLE lastheard_old`);
      
      console.log('Migration completed successfully');
    } else {
      // Create lastheard table with new schema
      sqlite.exec(`
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
    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS idx_start ON lastheard(Start DESC);
      CREATE INDEX IF NOT EXISTS idx_source_id ON lastheard(SourceID);
      CREATE INDEX IF NOT EXISTS idx_destination_id ON lastheard(DestinationID);
      CREATE INDEX IF NOT EXISTS idx_source_call ON lastheard(SourceCall);
    `);

    // Create api_keys table
    sqlite.exec(`
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
    sqlite.exec(`
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
    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS idx_api_key ON api_keys(api_key);
      CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verifications(verification_token);
    `);

    // Create talkgroups table
    sqlite.exec(`
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
    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS idx_talkgroup_id ON talkgroups(talkgroup_id);
      CREATE INDEX IF NOT EXISTS idx_country ON talkgroups(country);
      CREATE INDEX IF NOT EXISTS idx_continent ON talkgroups(continent);
    `);

    // Migrate existing api_keys table to add expires_at column if it doesn't exist
    try {
      const columns = sqlite.pragma('table_info(api_keys)');
      const hasExpiresAt = columns.some(col => col.name === 'expires_at');
      
      if (!hasExpiresAt) {
        console.log('Migrating api_keys table to add expires_at column...');
        sqlite.exec(`ALTER TABLE api_keys ADD COLUMN expires_at INTEGER`);
        
        // Set expiration date for existing keys (365 days from created_at)
        sqlite.exec(`
          UPDATE api_keys 
          SET expires_at = created_at + (365 * 24 * 60 * 60)
          WHERE expires_at IS NULL
        `);
        
        console.log('Migration completed successfully');
      }
    } catch (error) {
      console.error('Error during migration:', error);
    }

    // Migrate existing api_keys table to add last_used_at column if it doesn't exist
    try {
      const columns = sqlite.pragma('table_info(api_keys)');
      const hasLastUsedAt = columns.some(col => col.name === 'last_used_at');
      
      if (!hasLastUsedAt) {
        console.log('Migrating api_keys table to add last_used_at column...');
        sqlite.exec(`ALTER TABLE api_keys ADD COLUMN last_used_at INTEGER`);
        console.log('Migration completed successfully');
      }
    } catch (error) {
      console.error('Error during migration:', error);
    }

    // Migrate existing api_keys table to add locale column if it doesn't exist
    try {
      const columns = sqlite.pragma('table_info(api_keys)');
      const hasLocale = columns.some(col => col.name === 'locale');
      
      if (!hasLocale) {
        console.log('Migrating api_keys table to add locale column...');
        sqlite.exec(`ALTER TABLE api_keys ADD COLUMN locale TEXT DEFAULT 'en'`);
        console.log('Migration completed successfully');
      }
    } catch (error) {
      console.error('Error during migration:', error);
    }

    // Migrate existing email_verifications table to add locale column if it doesn't exist
    try {
      const columns = sqlite.pragma('table_info(email_verifications)');
      const hasLocale = columns.some(col => col.name === 'locale');
      
      if (!hasLocale) {
        console.log('Migrating email_verifications table to add locale column...');
        sqlite.exec(`ALTER TABLE email_verifications ADD COLUMN locale TEXT DEFAULT 'en'`);
        console.log('Migration completed successfully');
      }
    } catch (error) {
      console.error('Error during migration:', error);
    }

    // Create users table for user registration
    sqlite.exec(`
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
    sqlite.exec(`
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
    sqlite.exec(`
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
    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_user_callsign ON users(callsign);
      CREATE INDEX IF NOT EXISTS idx_user_verification_token ON user_verifications(verification_token);
      CREATE INDEX IF NOT EXISTS idx_session_token ON user_sessions(session_token);
    `);

    // Create password_reset_tokens table for password recovery
    sqlite.exec(`
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
    sqlite.exec(`
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
    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(reset_token);
      CREATE INDEX IF NOT EXISTS idx_old_email_token ON email_change_tokens(old_email_token);
      CREATE INDEX IF NOT EXISTS idx_new_email_token ON email_change_tokens(new_email_token);
    `);

    console.log('SQLite database initialized successfully');
  };
}

module.exports = {
  db,
  pool,
  initDatabase,
  usePostgres,
};
