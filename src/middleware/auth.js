const { db } = require('../db/database');

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key is required. Please include X-API-Key header in your request.',
      message: 'To request an API key, visit /api/auth/request-key'
    });
  }

  try {
    const stmt = db.prepare('SELECT * FROM api_keys WHERE api_key = ? AND is_active = 1');
    const keyRecord = stmt.get(apiKey);

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
      const deactivateStmt = db.prepare('UPDATE api_keys SET is_active = 0 WHERE id = ?');
      deactivateStmt.run(keyRecord.id);
      
      return res.status(403).json({ 
        error: 'API key has expired',
        message: 'Your API key has expired. Please request a new one at /api/auth/request-key'
      });
    }

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
