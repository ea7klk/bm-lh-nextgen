require('dotenv').config();
const { pool } = require('./src/db/database');
const bcrypt = require('bcrypt');

async function insertTestData() {
  try {
    // Insert some test lastheard records
    console.log('Inserting test lastheard records...');
    await pool.query(`
      INSERT INTO lastheard ("SourceID", "DestinationID", "SourceCall", "SourceName", "DestinationCall", "DestinationName", "Start", "Stop", duration)
      VALUES 
        (1234567, 91, 'EA7KLK', 'Test User 1', 'TG91', 'Spain', ${Math.floor(Date.now()/1000)}, ${Math.floor(Date.now()/1000) + 10}, 10),
        (2345678, 214, 'N0CALL', 'Test User 2', 'TG214', 'Spain', ${Math.floor(Date.now()/1000)}, ${Math.floor(Date.now()/1000) + 20}, 20)
    `);
    console.log('✅ Inserted lastheard records');
    
    // Insert test users
    console.log('\nInserting test users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    await pool.query(`
      INSERT INTO users (callsign, name, email, password_hash, is_active, created_at, last_login_at, locale)
      VALUES 
        ('EA7KLK', 'Test User 1', 'test1@example.com', $1, true, ${Math.floor(Date.now()/1000)}, ${Math.floor(Date.now()/1000)}, 'en'),
        ('N0CALL', 'Test User 2', 'test2@example.com', $1, false, ${Math.floor(Date.now()/1000) - 86400}, NULL, 'es')
    `, [passwordHash]);
    console.log('✅ Inserted test users');
    
    // Verify data
    console.log('\nVerifying data...');
    const lhCount = await pool.query('SELECT COUNT(*) FROM lastheard');
    console.log('Lastheard records:', lhCount.rows[0].count);
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log('User records:', userCount.rows[0].count);
    
    console.log('\n✅ Test data inserted successfully');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

insertTestData();
