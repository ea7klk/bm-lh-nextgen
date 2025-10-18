require('dotenv').config();
const { pool, initDatabase } = require('./src/db/database');

// Override database settings for testing
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_NAME = 'bm_lastheard_test';

async function testAdminEndpoints() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized');
    
    // Test the stats query
    console.log('\nTesting /admin/stats query...');
    const totalRecords = await pool.query('SELECT COUNT(*) as count FROM lastheard WHERE "DestinationID" != 9');
    console.log('Total records result:', totalRecords.rows[0]);
    console.log('Count type:', typeof totalRecords.rows[0].count);
    console.log('Parsed:', parseInt(totalRecords.rows[0].count));
    
    const uniqueTalkgroups = await pool.query('SELECT COUNT(DISTINCT "DestinationID") as count FROM lastheard WHERE "DestinationID" != 9');
    console.log('Unique talkgroups result:', uniqueTalkgroups.rows[0]);
    
    const uniqueCallsigns = await pool.query('SELECT COUNT(DISTINCT "SourceCall") as count FROM lastheard WHERE "DestinationID" != 9');
    console.log('Unique callsigns result:', uniqueCallsigns.rows[0]);
    
    // Test the users query  
    console.log('\nTesting /admin/users query...');
    const users = await pool.query('SELECT id, callsign, name, email, is_active, created_at, last_login_at, locale FROM users ORDER BY created_at DESC');
    console.log('Users result:', users.rows);
    console.log('Row count:', users.rows.length);
    
    console.log('\n✅ All queries executed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testAdminEndpoints();
