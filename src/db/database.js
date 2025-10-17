const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'bm-lh-postgres',
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

// PostgreSQL database wrapper that mimics better-sqlite3 API
const db = {
  prepare: (sql) => {
    // Convert SQLite parameterized queries (?) to PostgreSQL ($1, $2, etc.)
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
async function initDatabase() {
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
}

module.exports = {
  db,
  pool,
  initDatabase,
};
