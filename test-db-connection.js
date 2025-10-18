#!/usr/bin/env node

/**
 * Test database connection and schema
 * 
 * This script tests the PostgreSQL connection and verifies the database schema.
 * Run this after starting PostgreSQL to ensure everything is configured correctly.
 * 
 * Usage:
 *   node test-db-connection.js
 */

require('dotenv').config();
const { pool, initDatabase } = require('./src/db/database');

async function testConnection() {
  console.log('=== Database Connection Test ===\n');
  
  try {
    // Test connection
    console.log('Testing PostgreSQL connection...');
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✓ Connected to PostgreSQL');
    console.log(`  Time: ${result.rows[0].current_time}`);
    console.log(`  Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}\n`);
    
    // Initialize database
    console.log('Initializing database schema...');
    await initDatabase();
    console.log('✓ Database schema initialized\n');
    
    // Verify tables exist
    console.log('Verifying tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✓ Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    console.log('\n=== All tests passed! ===');
    process.exit(0);
  } catch (error) {
    console.error('\n=== Test failed ===');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure PostgreSQL is running: docker-compose ps');
    console.error('2. Check environment variables in .env file');
    console.error('3. Verify database credentials: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (error) {
      // Ignore errors when closing pool
    }
  }
}

testConnection();
