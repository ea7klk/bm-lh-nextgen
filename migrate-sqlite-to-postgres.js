#!/usr/bin/env node

/**
 * SQLite to PostgreSQL Migration Script
 * 
 * This script migrates data from an SQLite database to PostgreSQL.
 * It merges data without overwriting existing records in PostgreSQL.
 * 
 * Prerequisites (Ubuntu):
 * - Node.js 18+ installed
 * - PostgreSQL client libraries: sudo apt-get install postgresql-client libpq-dev
 * - Node modules: npm install (or npm install pg better-sqlite3)
 * 
 * Usage:
 *   node migrate-sqlite-to-postgres.js
 * 
 * Environment variables required:
 *   DB_HOST - PostgreSQL host (default: localhost)
 *   DB_PORT - PostgreSQL port (default: 5432)
 *   DB_USER - PostgreSQL user (default: bm_user)
 *   DB_PASSWORD - PostgreSQL password
 *   DB_NAME - PostgreSQL database name (default: bm_lastheard)
 *   SQLITE_DB_PATH - Path to SQLite database file (default: ./data/lastheard.db)
 */

require('dotenv').config();
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');

// Configuration
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, 'data', 'lastheard.db');
const PG_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'bm_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bm_lastheard',
  max: 20,
};

// Table migration configurations
const TABLES = [
  {
    name: 'lastheard',
    columns: ['id', 'SourceID', 'DestinationID', 'SourceCall', 'SourceName', 'DestinationCall', 'DestinationName', 'Start', 'Stop', 'TalkerAlias', 'duration', 'created_at'],
    primaryKey: 'id',
    checkExisting: 'SELECT id FROM lastheard WHERE id = $1',
  },
  {
    name: 'talkgroups',
    columns: ['id', 'talkgroup_id', 'name', 'country', 'continent', 'full_country_name', 'last_updated'],
    primaryKey: 'id',
    uniqueKey: 'talkgroup_id',
    checkExisting: 'SELECT id FROM talkgroups WHERE talkgroup_id = $1',
  },
  {
    name: 'users',
    columns: ['id', 'callsign', 'name', 'email', 'password_hash', 'is_active', 'created_at', 'last_login_at', 'locale'],
    primaryKey: 'id',
    uniqueKey: 'email',
    checkExisting: 'SELECT id FROM users WHERE email = $1',
  },
  {
    name: 'user_verifications',
    columns: ['id', 'callsign', 'name', 'email', 'password_hash', 'verification_token', 'is_verified', 'created_at', 'expires_at', 'locale'],
    primaryKey: 'id',
    uniqueKey: 'verification_token',
    checkExisting: 'SELECT id FROM user_verifications WHERE verification_token = $1',
  },
  {
    name: 'user_sessions',
    columns: ['id', 'session_token', 'user_id', 'created_at', 'expires_at'],
    primaryKey: 'id',
    uniqueKey: 'session_token',
    checkExisting: 'SELECT id FROM user_sessions WHERE session_token = $1',
  },
  {
    name: 'password_reset_tokens',
    columns: ['id', 'user_id', 'reset_token', 'is_used', 'created_at', 'expires_at'],
    primaryKey: 'id',
    uniqueKey: 'reset_token',
    checkExisting: 'SELECT id FROM password_reset_tokens WHERE reset_token = $1',
  },
  {
    name: 'email_change_tokens',
    columns: ['id', 'user_id', 'old_email', 'new_email', 'old_email_token', 'new_email_token', 'old_email_verified', 'new_email_verified', 'created_at', 'expires_at'],
    primaryKey: 'id',
    uniqueKey: 'old_email_token',
    checkExisting: 'SELECT id FROM email_change_tokens WHERE old_email_token = $1',
  },
];

async function migrate() {
  console.log('=== SQLite to PostgreSQL Migration ===\n');
  
  // Check if SQLite database exists
  const fs = require('fs');
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error(`ERROR: SQLite database not found at: ${SQLITE_DB_PATH}`);
    console.error('Please ensure the SQLite database file exists or set SQLITE_DB_PATH environment variable.');
    process.exit(1);
  }

  console.log(`SQLite database: ${SQLITE_DB_PATH}`);
  console.log(`PostgreSQL: ${PG_CONFIG.user}@${PG_CONFIG.host}:${PG_CONFIG.port}/${PG_CONFIG.database}\n`);

  // Connect to databases
  let sqliteDb;
  let pgPool;
  
  try {
    console.log('Connecting to SQLite database...');
    sqliteDb = new Database(SQLITE_DB_PATH, { readonly: true });
    console.log('✓ Connected to SQLite\n');

    console.log('Connecting to PostgreSQL database...');
    pgPool = new Pool(PG_CONFIG);
    await pgPool.query('SELECT 1'); // Test connection
    console.log('✓ Connected to PostgreSQL\n');

    // Migrate each table
    for (const table of TABLES) {
      await migrateTable(sqliteDb, pgPool, table);
    }

    console.log('\n=== Migration completed successfully! ===');
  } catch (error) {
    console.error('\n=== Migration failed ===');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (sqliteDb) {
      sqliteDb.close();
    }
    if (pgPool) {
      await pgPool.end();
    }
  }
}

async function migrateTable(sqliteDb, pgPool, tableConfig) {
  const { name, columns, uniqueKey, checkExisting } = tableConfig;
  
  console.log(`--- Migrating table: ${name} ---`);
  
  try {
    // Check if table exists in SQLite
    const tableExists = sqliteDb.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(name);
    
    if (!tableExists) {
      console.log(`  ⚠ Table ${name} does not exist in SQLite, skipping...`);
      return;
    }

    // Get all rows from SQLite
    const rows = sqliteDb.prepare(`SELECT * FROM ${name}`).all();
    console.log(`  Found ${rows.length} rows in SQLite`);

    if (rows.length === 0) {
      console.log(`  No data to migrate for ${name}`);
      return;
    }

    let inserted = 0;
    let skipped = 0;

    // Migrate each row
    for (const row of rows) {
      // Check if row already exists in PostgreSQL
      const checkValue = uniqueKey ? row[uniqueKey] : row[tableConfig.primaryKey];
      const existing = await pgPool.query(checkExisting, [checkValue]);

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Build INSERT query for PostgreSQL
      const columnList = columns.filter(col => row[col] !== undefined);
      const quotedColumns = columnList.map(col => `"${col}"`).join(', ');
      const placeholders = columnList.map((_, i) => `$${i + 1}`).join(', ');
      const values = columnList.map(col => {
        // Convert SQLite boolean (0/1) to PostgreSQL boolean (true/false)
        if (typeof row[col] === 'number' && (col.includes('is_') || col.includes('_verified') || col.includes('_used'))) {
          return row[col] === 1;
        }
        return row[col];
      });

      const insertQuery = `INSERT INTO ${name} (${quotedColumns}) VALUES (${placeholders})`;

      try {
        await pgPool.query(insertQuery, values);
        inserted++;
      } catch (error) {
        console.error(`  ✗ Error inserting row with ${uniqueKey || tableConfig.primaryKey}=${checkValue}:`, error.message);
      }
    }

    console.log(`  ✓ Inserted: ${inserted}, Skipped (already exists): ${skipped}`);

    // Update sequence for auto-increment columns
    if (inserted > 0 && tableConfig.primaryKey === 'id') {
      try {
        await pgPool.query(`
          SELECT setval(pg_get_serial_sequence('${name}', 'id'), 
            (SELECT MAX(id) FROM ${name}), true)
        `);
        console.log(`  ✓ Updated ${name} sequence`);
      } catch (error) {
        console.log(`  ⚠ Could not update sequence for ${name}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`  ✗ Error migrating table ${name}:`, error.message);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrate().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { migrate };
