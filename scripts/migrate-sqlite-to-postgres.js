#!/usr/bin/env node
/**
 * SQLite to PostgreSQL Migration Script
 * 
 * This script migrates all data from the SQLite database to PostgreSQL.
 * It should be run from within the container after both databases are available.
 * 
 * Usage:
 *   node scripts/migrate-sqlite-to-postgres.js
 */

const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');

// SQLite database path
const sqliteDbPath = path.join(__dirname, '../data/lastheard.db');

// PostgreSQL connection
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'bm_lh_user',
  password: process.env.DB_PASSWORD || 'changeme',
  database: process.env.DB_NAME || 'bm_lh_nextgen',
});

// Tables to migrate
const TABLES = [
  'lastheard',
  'api_keys',
  'email_verifications',
  'talkgroups',
  'users',
  'user_verifications',
  'user_sessions',
  'password_reset_tokens',
  'email_change_tokens'
];

async function migrateTable(tableName, sqliteDb, pgPool) {
  console.log(`\nMigrating table: ${tableName}`);
  
  try {
    // Check if table exists in SQLite
    const tableExists = sqliteDb.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(tableName);
    
    if (!tableExists) {
      console.log(`  ⚠️  Table ${tableName} does not exist in SQLite, skipping...`);
      return { skipped: true };
    }
    
    // Get all rows from SQLite
    const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`  Found ${rows.length} rows to migrate`);
    
    if (rows.length === 0) {
      console.log(`  ✓ No data to migrate`);
      return { migrated: 0 };
    }
    
    // Get column names from first row
    const columns = Object.keys(rows[0]);
    
    // Build PostgreSQL INSERT query with proper column quoting
    const quotedColumns = columns.map(col => `"${col}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const insertQuery = `
      INSERT INTO ${tableName} (${quotedColumns})
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;
    
    // Migrate rows in batches
    const BATCH_SIZE = 100;
    let migratedCount = 0;
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      for (const row of batch) {
        const values = columns.map(col => row[col]);
        try {
          await pgPool.query(insertQuery, values);
          migratedCount++;
        } catch (error) {
          // Log error but continue with other rows
          console.log(`  ⚠️  Error migrating row: ${error.message}`);
        }
      }
      
      console.log(`  Migrated ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} rows`);
    }
    
    // Reset sequence for SERIAL columns if we migrated data
    if (migratedCount > 0 && columns.includes('id')) {
      try {
        await pgPool.query(`
          SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
            COALESCE((SELECT MAX(id) FROM ${tableName}), 1), true)
        `);
        console.log(`  ✓ Reset sequence for ${tableName}.id`);
      } catch (error) {
        console.log(`  ⚠️  Could not reset sequence: ${error.message}`);
      }
    }
    
    console.log(`  ✓ Successfully migrated ${migratedCount} rows`);
    return { migrated: migratedCount };
  } catch (error) {
    console.error(`  ❌ Error migrating ${tableName}:`, error.message);
    return { error: error.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('SQLite to PostgreSQL Migration');
  console.log('='.repeat(60));
  
  // Check if SQLite database exists
  const fs = require('fs');
  if (!fs.existsSync(sqliteDbPath)) {
    console.error(`\n❌ SQLite database not found at: ${sqliteDbPath}`);
    console.error('Please ensure the database file exists before running migration.');
    process.exit(1);
  }
  
  console.log(`\nSQLite database: ${sqliteDbPath}`);
  console.log(`PostgreSQL host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`PostgreSQL database: ${process.env.DB_NAME || 'bm_lh_nextgen'}`);
  
  let sqliteDb;
  try {
    // Open SQLite database
    sqliteDb = new Database(sqliteDbPath, { readonly: true });
    console.log('\n✓ Connected to SQLite database');
    
    // Test PostgreSQL connection
    await pgPool.query('SELECT NOW()');
    console.log('✓ Connected to PostgreSQL database');
    
    // Migrate each table
    const results = {};
    for (const tableName of TABLES) {
      results[tableName] = await migrateTable(tableName, sqliteDb, pgPool);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const [tableName, result] of Object.entries(results)) {
      if (result.skipped) {
        console.log(`${tableName}: SKIPPED (table not found in SQLite)`);
        totalSkipped++;
      } else if (result.error) {
        console.log(`${tableName}: ERROR - ${result.error}`);
        totalErrors++;
      } else {
        console.log(`${tableName}: ${result.migrated} rows migrated`);
        totalMigrated += result.migrated;
      }
    }
    
    console.log('\n' + '-'.repeat(60));
    console.log(`Total rows migrated: ${totalMigrated}`);
    console.log(`Tables skipped: ${totalSkipped}`);
    console.log(`Tables with errors: ${totalErrors}`);
    console.log('='.repeat(60));
    
    if (totalErrors === 0) {
      console.log('\n✓ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review the log above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (sqliteDb) {
      sqliteDb.close();
      console.log('\n✓ Closed SQLite connection');
    }
    await pgPool.end();
    console.log('✓ Closed PostgreSQL connection');
  }
}

// Run migration
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
