function authenticateAdmin(req, res, next) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Check if admin password is configured
  if (!adminPassword) {
    return res.status(503).json({ 
      error: 'Admin access not configured',
      message: 'Please set ADMIN_PASSWORD in .env file'
    });
  }

  // Check for password in Authorization header (Basic Auth)
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    // Send 401 with WWW-Authenticate header to trigger browser's basic auth prompt
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
    return res.status(401).send('Authentication required');
  }

  // Parse Basic Auth header
  const base64Credentials = authHeader.split(' ')[1] || '';
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  // Verify password (username is ignored)
  if (password !== adminPassword) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
    return res.status(401).send('Invalid credentials');
  }

  next();
}

module.exports = {
  authenticateAdmin,
};
