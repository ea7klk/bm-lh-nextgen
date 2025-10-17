const { db } = require('../db/database');

function authenticateUser(req, res, next) {
  const sessionToken = req.cookies.session_token;

  if (!sessionToken) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }

  try {
    // Find session
    const sessionStmt = db.prepare(`
      SELECT us.*, u.id as user_id, u.callsign, u.name, u.email, u.is_active, u.locale
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.session_token = ?
    `);
    const session = sessionStmt.get(sessionToken);

    if (!session) {
      res.clearCookie('session_token');
      return res.status(401).json({ 
        error: 'Invalid session',
        message: 'Your session has expired. Please log in again.'
      });
    }

    // Check if session has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (session.expires_at < currentTime) {
      // Delete expired session
      const deleteStmt = db.prepare('DELETE FROM user_sessions WHERE id = ?');
      deleteStmt.run(session.id);
      res.clearCookie('session_token');
      
      return res.status(401).json({ 
        error: 'Session expired',
        message: 'Your session has expired. Please log in again.'
      });
    }

    // Check if user is active
    if (!session.is_active) {
      return res.status(403).json({ 
        error: 'Account inactive',
        message: 'Your account is not active. Please contact support.'
      });
    }

    // Attach user data to request
    req.user = {
      id: session.user_id,
      callsign: session.callsign,
      name: session.name,
      email: session.email,
      locale: session.locale
    };

    next();
  } catch (error) {
    console.error('Error validating user session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function optionalAuthentication(req, res, next) {
  const sessionToken = req.cookies.session_token;

  if (!sessionToken) {
    req.user = null;
    return next();
  }

  try {
    const sessionStmt = db.prepare(`
      SELECT us.*, u.id as user_id, u.callsign, u.name, u.email, u.is_active, u.locale
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.session_token = ?
    `);
    const session = sessionStmt.get(sessionToken);

    if (!session) {
      req.user = null;
      return next();
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (session.expires_at < currentTime || !session.is_active) {
      req.user = null;
      return next();
    }

    req.user = {
      id: session.user_id,
      callsign: session.callsign,
      name: session.name,
      email: session.email,
      locale: session.locale
    };

    next();
  } catch (error) {
    console.error('Error in optional authentication:', error);
    req.user = null;
    next();
  }
}

module.exports = {
  authenticateUser,
  optionalAuthentication,
};
