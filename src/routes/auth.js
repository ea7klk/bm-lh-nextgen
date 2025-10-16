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
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find verification record
    const verification = db.prepare(
      'SELECT * FROM email_verifications WHERE verification_token = ?'
    ).get(token);

    if (!verification) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    if (verification.is_verified) {
      return res.status(400).json({ 
        error: 'This email has already been verified',
        message: 'Check your email for the API key'
      });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (verification.expires_at < currentTime) {
      return res.status(400).json({ 
        error: 'Verification token has expired',
        message: 'Please request a new API key at /api/auth/request-key'
      });
    }

    // Generate API key
    const apiKey = uuidv4();

    // Insert API key
    const insertStmt = db.prepare(`
      INSERT INTO api_keys (api_key, name, email)
      VALUES (?, ?, ?)
    `);
    insertStmt.run(apiKey, verification.name, verification.email);

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

    res.json({ 
      message: 'Email verified successfully! Your API key has been sent to your email.',
      apiKey: apiKey,
      note: 'Please save this API key securely. Include it in the X-API-Key header for API requests.'
    });
  } catch (error) {
    console.error('Error in verify-email:', error);
    res.status(500).json({ error: 'Internal server error' });
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
