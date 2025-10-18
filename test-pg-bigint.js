const { Pool } = require('pg');

async function testBigIntBehavior() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    // Create a test table
    await pool.query('DROP TABLE IF EXISTS test_timestamps');
    await pool.query(`
      CREATE TABLE test_timestamps (
        id SERIAL PRIMARY KEY,
        created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())
      )
    `);
    
    // Insert a test record
    await pool.query('INSERT INTO test_timestamps DEFAULT VALUES');
    
    // Query it back
    const result = await pool.query('SELECT * FROM test_timestamps');
    const row = result.rows[0];
    
    console.log('Row data:', row);
    console.log('created_at type:', typeof row.created_at);
    console.log('created_at value:', row.created_at);
    console.log('Is string?', typeof row.created_at === 'string');
    
    // Clean up
    await pool.query('DROP TABLE test_timestamps');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testBigIntBehavior();
