const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { sendVerificationEmail, sendApiKeyEmail } = require('../services/emailService');

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKeyRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           description: User's name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 */

/**
 * @swagger
 * /api/auth/request-key:
 *   post:
 *     summary: Request an API key
 *     description: Submit a request for an API key. A verification email will be sent.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiKeyRequest'
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/ApiKeyRequest'
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/request-key', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Generate verification token
    const verificationToken = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours from now

    // Check if email already has an active API key
    const existingKey = db.prepare('SELECT * FROM api_keys WHERE email = ? AND is_active = 1').get(email);
    if (existingKey) {
      return res.status(400).json({ 
        error: 'This email already has an active API key',
        message: 'Check your email for the API key or contact support'
      });
    }

    // Check if there's a pending verification for this email
    const existingVerification = db.prepare(
      'SELECT * FROM email_verifications WHERE email = ? AND is_verified = 0 AND expires_at > ?'
    ).get(email, Math.floor(Date.now() / 1000));

    if (existingVerification) {
      // Resend verification email with existing token
      const emailSent = await sendVerificationEmail(email, name, existingVerification.verification_token);
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
      }
      return res.json({ 
        message: 'Verification email resent. Please check your inbox and spam folder.',
        email: email
      });
    }

    // Insert verification record
    const stmt = db.prepare(`
      INSERT INTO email_verifications (email, name, verification_token, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(email, name, verificationToken, expiresAt);

    // Send verification email
    const emailSent = await sendVerificationEmail(email, name, verificationToken);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
    }

    res.json({ 
      message: 'Verification email sent. Please check your inbox and spam folder.',
      email: email
    });
  } catch (error) {
    console.error('Error in request-key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email address
 *     description: Verify email address using the token sent via email
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token from email
 *     responses:
 *       200:
 *         description: Email verified and API key created
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Error - Brandmeister Lastheard Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .error-icon { color: #dc3545; }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
        }
        p {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .back-link:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon error-icon">⚠️</div>
        <h1>Verification Error</h1>
        <p>Verification token is required</p>
        <a href="/api/auth/request-key" class="back-link">Request New API Key</a>
    </div>
</body>
</html>
      `);
    }

    // Find verification record
    const verification = db.prepare(
      'SELECT * FROM email_verifications WHERE verification_token = ?'
    ).get(token);

    if (!verification) {
      return res.status(400).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invalid Token - Brandmeister Lastheard Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .error-icon { color: #dc3545; }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
        }
        p {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .back-link:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon error-icon">❌</div>
        <h1>Invalid Verification Token</h1>
        <p>The verification token is invalid or does not exist.</p>
        <a href="/api/auth/request-key" class="back-link">Request New API Key</a>
    </div>
</body>
</html>
      `);
    }

    if (verification.is_verified) {
      return res.status(400).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Already Verified - Brandmeister Lastheard Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .warning-icon { color: #ffc107; }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
        }
        p {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .info-box {
            background: #e7f3ff;
            padding: 16px;
            border-radius: 6px;
            margin-top: 20px;
            border-left: 4px solid #667eea;
        }
        .info-box p {
            margin: 0;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .back-link:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon warning-icon">ℹ️</div>
        <h1>Already Verified</h1>
        <p>This email has already been verified.</p>
        <div class="info-box">
            <p><strong>Check your email for your API key</strong></p>
        </div>
        <a href="/" class="back-link">Go to API Home</a>
    </div>
</body>
</html>
      `);
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (verification.expires_at < currentTime) {
      return res.status(400).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Expired - Brandmeister Lastheard Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .warning-icon { color: #ffc107; }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
        }
        p {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .back-link:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon warning-icon">⏱️</div>
        <h1>Verification Token Expired</h1>
        <p>This verification token has expired. Please request a new API key.</p>
        <a href="/api/auth/request-key" class="back-link">Request New API Key</a>
    </div>
</body>
</html>
      `);
    }

    // Generate API key
    const apiKey = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 365 days from now

    // Insert API key
    const insertStmt = db.prepare(`
      INSERT INTO api_keys (api_key, name, email, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    insertStmt.run(apiKey, verification.name, verification.email, expiresAt);

    // Mark verification as complete
    const updateStmt = db.prepare(
      'UPDATE email_verifications SET is_verified = 1 WHERE id = ?'
    );
    updateStmt.run(verification.id);

    // Send API key via email
    const emailSent = await sendApiKeyEmail(verification.email, verification.name, apiKey);
    
    if (!emailSent) {
      console.error('Failed to send API key email, but key was created');
    }

    // Calculate expiry date for display
    const expiryDate = new Date(expiresAt * 1000).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verified - Brandmeister Lastheard Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
            text-align: center;
        }
        .success-icon { color: #28a745; }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
            text-align: center;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
            text-align: center;
        }
        .api-key-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 2px dashed #667eea;
        }
        .api-key-label {
            color: #666;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .api-key {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            color: #333;
            word-break: break-all;
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
        }
        .copy-btn {
            margin-top: 10px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background 0.2s;
        }
        .copy-btn:hover {
            background: #5568d3;
        }
        .copy-btn.copied {
            background: #28a745;
        }
        .info {
            background: #e7f3ff;
            padding: 16px;
            border-radius: 6px;
            margin-top: 20px;
            border-left: 4px solid #667eea;
        }
        .info p {
            color: #333;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .info p:last-child {
            margin-bottom: 0;
        }
        .info strong {
            color: #667eea;
        }
        .warning {
            background: #fff3cd;
            padding: 16px;
            border-radius: 6px;
            margin-top: 20px;
            border-left: 4px solid #ffc107;
        }
        .warning p {
            color: #856404;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
        }
        .expiry-info {
            background: #f0f0f0;
            padding: 12px;
            border-radius: 6px;
            margin-top: 10px;
            text-align: center;
        }
        .expiry-info p {
            color: #666;
            font-size: 14px;
            margin: 0;
        }
        .example {
            background: #2d2d2d;
            padding: 16px;
            border-radius: 6px;
            margin-top: 20px;
            overflow-x: auto;
        }
        .example code {
            color: #fff;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.6;
            display: block;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
        }
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon success-icon">✅</div>
        <h1>Email Verified Successfully!</h1>
        <p class="subtitle">Your API key has been generated and sent to your email</p>
        
        <div class="api-key-box">
            <div class="api-key-label">YOUR API KEY</div>
            <div class="api-key" id="apiKey">${apiKey}</div>
            <button class="copy-btn" id="copyBtn" onclick="copyApiKey()">Copy to Clipboard</button>
        </div>

        <div class="expiry-info">
            <p><strong>Valid until:</strong> ${expiryDate}</p>
        </div>
        
        <div class="warning">
            <p><strong>⚠️ Important:</strong> Please save this API key securely. You will need it to access the API. We've also sent it to your email for safekeeping.</p>
        </div>
        
        <div class="info">
            <p><strong>How to use your API key:</strong></p>
            <p>Include your API key in the <code>X-API-Key</code> header with all API requests.</p>
        </div>
        
        <div class="example">
            <code>curl -H "X-API-Key: ${apiKey}" \\
     ${process.env.BASE_URL || 'http://localhost:3000'}/api/lastheard</code>
        </div>
        
        <a href="/" class="back-link">← Go to API Home</a>
    </div>

    <script>
        function copyApiKey() {
            const apiKey = document.getElementById('apiKey').textContent;
            const btn = document.getElementById('copyBtn');
            
            navigator.clipboard.writeText(apiKey).then(() => {
                btn.textContent = '✓ Copied!';
                btn.classList.add('copied');
                
                setTimeout(() => {
                    btn.textContent = 'Copy to Clipboard';
                    btn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        }
    </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('Error in verify-email:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - Brandmeister Lastheard Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .error-icon { color: #dc3545; }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
        }
        p {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .back-link:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon error-icon">💥</div>
        <h1>Internal Server Error</h1>
        <p>We're sorry, something went wrong. Please try again later.</p>
        <a href="/api/auth/request-key" class="back-link">Request New API Key</a>
    </div>
</body>
</html>
    `);
  }
});

/**
 * @swagger
 * /api/auth/request-key:
 *   get:
 *     summary: Display API key request form
 *     description: Show an HTML form for requesting an API key
 *     responses:
 *       200:
 *         description: HTML form
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/request-key', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Request API Key - Brandmeister Lastheard Next Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #333;
            margin-bottom: 8px;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        button:active {
            transform: translateY(0);
        }
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        .message {
            margin-top: 20px;
            padding: 12px;
            border-radius: 6px;
            display: none;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .info {
            background: #e7f3ff;
            padding: 16px;
            border-radius: 6px;
            margin-top: 20px;
            border-left: 4px solid #667eea;
        }
        .info p {
            color: #333;
            font-size: 14px;
            line-height: 1.6;
        }
        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
        }
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Request API Key</h1>
        <p class="subtitle">Brandmeister Lastheard Next Generation API</p>
        
        <form id="apiKeyForm">
            <div class="form-group">
                <label for="name">Name *</label>
                <input type="text" id="name" name="name" required placeholder="Enter your name">
            </div>
            
            <div class="form-group">
                <label for="email">Email Address *</label>
                <input type="email" id="email" name="email" required placeholder="Enter your email">
            </div>
            
            <button type="submit" id="submitBtn">Request API Key</button>
        </form>
        
        <div id="message" class="message"></div>
        
        <div class="info">
            <p><strong>How it works:</strong></p>
            <p>1. Enter your name and email address</p>
            <p>2. Check your email for a verification link</p>
            <p>3. Click the link to verify and receive your API key</p>
            <p>4. Use the API key in the <code>X-API-Key</code> header</p>
        </div>
        
        <a href="/" class="back-link">← Back to API</a>
    </div>

    <script>
        document.getElementById('apiKeyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            messageDiv.style.display = 'none';
            
            try {
                const response = await fetch('/api/auth/request-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageDiv.className = 'message success';
                    messageDiv.textContent = data.message;
                    messageDiv.style.display = 'block';
                    document.getElementById('apiKeyForm').reset();
                } else {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = data.error || 'An error occurred';
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Failed to send request. Please try again.';
                messageDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Request API Key';
            }
        });
    </script>
</body>
</html>
  `);
});

module.exports = router;
