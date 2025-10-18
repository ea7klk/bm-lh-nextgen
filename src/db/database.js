const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'bm_user',
  password: process.env.DB_PASSWORD || 'changeme',
  database: process.env.DB_NAME || 'bm_lastheard',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database schema
async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing database schema...');

    // Create lastheard table
    await client.query(`
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
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())
      )
    `);

    // Create indexes for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_start ON lastheard("Start" DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_source_id ON lastheard("SourceID")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_destination_id ON lastheard("DestinationID")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_source_call ON lastheard("SourceCall")
    `);

    // Create talkgroups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS talkgroups (
        id SERIAL PRIMARY KEY,
        talkgroup_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        continent TEXT,
        full_country_name TEXT,
        last_updated BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())
      )
    `);

    // Create indexes for talkgroups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_talkgroup_id ON talkgroups(talkgroup_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_country ON talkgroups(country)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_continent ON talkgroups(continent)
    `);

    // Create users table for user registration
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        callsign TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
        last_login_at BIGINT,
        locale TEXT DEFAULT 'en'
      )
    `);

    // Create user_verifications table for email verification during registration
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_verifications (
        id SERIAL PRIMARY KEY,
        callsign TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        verification_token TEXT UNIQUE NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
        expires_at BIGINT NOT NULL,
        locale TEXT DEFAULT 'en'
      )
    `);

    // Create sessions table for user sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
        expires_at BIGINT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for users and sessions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_email ON users(email)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_callsign ON users(callsign)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_verification_token ON user_verifications(verification_token)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_token ON user_sessions(session_token)
    `);

    // Create password_reset_tokens table for password recovery
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        reset_token TEXT UNIQUE NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
        expires_at BIGINT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create email_change_tokens table for email change verification
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_change_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        old_email TEXT NOT NULL,
        new_email TEXT NOT NULL,
        old_email_token TEXT UNIQUE NOT NULL,
        new_email_token TEXT UNIQUE,
        old_email_verified BOOLEAN DEFAULT FALSE,
        new_email_verified BOOLEAN DEFAULT FALSE,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
        expires_at BIGINT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for password reset and email change tokens
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(reset_token)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_old_email_token ON email_change_tokens(old_email_token)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_new_email_token ON email_change_tokens(new_email_token)
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDatabase,
};
