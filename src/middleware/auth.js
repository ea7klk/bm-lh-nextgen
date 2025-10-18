const { pool } = require('../db/database');

async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key is required. Please include X-API-Key header in your request.',
      message: 'To request an API key, visit /api/auth/request-key'
    });
  }

  try {
    const result = await pool.query('SELECT * FROM api_keys WHERE api_key = $1 AND is_active = TRUE', [apiKey]);
    const keyRecord = result.rows[0];

    if (!keyRecord) {
      return res.status(403).json({ 
        error: 'Invalid or inactive API key',
        message: 'To request an API key, visit /api/auth/request-key'
      });
    }

    // Check if the API key has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (keyRecord.expires_at && keyRecord.expires_at < currentTime) {
      // Deactivate the expired key
      await pool.query('UPDATE api_keys SET is_active = FALSE WHERE id = $1', [keyRecord.id]);
      
      return res.status(403).json({ 
        error: 'API key has expired',
        message: 'Your API key has expired. Please request a new one at /api/auth/request-key'
      });
    }

    // Update last_used_at timestamp
    await pool.query('UPDATE api_keys SET last_used_at = $1 WHERE id = $2', [currentTime, keyRecord.id]);

    req.apiKeyData = keyRecord;
    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  authenticateApiKey,
};
