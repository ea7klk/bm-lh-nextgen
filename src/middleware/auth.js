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
