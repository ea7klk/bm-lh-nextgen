const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { sendVerificationEmail } = require('../services/emailService');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegistration:
 *       type: object
 *       required:
 *         - callsign
 *         - name
 *         - email
 *         - password
 *       properties:
 *         callsign:
 *           type: string
 *           description: User's callsign (will be converted to uppercase)
 *           example: EA7KLK
 *         name:
 *           type: string
 *           description: User's full name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (minimum 8 characters)
 *           example: securepassword123
 *     UserLogin:
 *       type: object
 *       required:
 *         - callsign
 *         - password
 *       properties:
 *         callsign:
 *           type: string
 *           description: User's callsign
 *           example: EA7KLK
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *           example: securepassword123
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User's unique identifier
 *         callsign:
 *           type: string
 *           description: User's callsign
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email address
 *         is_active:
 *           type: integer
 *           description: Whether the user account is active (0 or 1)
 *         created_at:
 *           type: integer
 *           description: Unix timestamp of account creation
 *         last_login_at:
 *           type: integer
 *           description: Unix timestamp of last login
 *         locale:
 *           type: string
 *           description: User's preferred language
 *           example: en
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: session_token
 *       description: Session token stored in HTTP-only cookie
 */

/**
 * User registration form
 */
router.get('/register', (req, res) => {
  const locale = res.locals.locale || 'en';
  const __ = req.__;
  
  res.send(`
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${__('user.registerTitle')} - Brandmeister Lastheard Next Generation</title>
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
        .login-link {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
        .login-link a {
            color: #667eea;
            text-decoration: none;
        }
        .login-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${__('user.registerTitle')}</h1>
        <p class="subtitle">${__('user.registerSubtitle')}</p>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="callsign">${__('user.callsign')} *</label>
                <input type="text" id="callsign" name="callsign" required placeholder="${__('user.callsignPlaceholder')}">
            </div>
            
            <div class="form-group">
                <label for="name">${__('user.name')} *</label>
                <input type="text" id="name" name="name" required placeholder="${__('user.namePlaceholder')}">
            </div>
            
            <div class="form-group">
                <label for="email">${__('user.email')} *</label>
                <input type="email" id="email" name="email" required placeholder="${__('user.emailPlaceholder')}">
            </div>
            
            <div class="form-group">
                <label for="password">${__('user.password')} *</label>
                <input type="password" id="password" name="password" required placeholder="${__('user.passwordPlaceholder')}">
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">${__('user.confirmPassword')} *</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required placeholder="${__('user.confirmPasswordPlaceholder')}">
            </div>
            
            <button type="submit" id="submitBtn">${__('user.registerButton')}</button>
        </form>
        
        <div id="message" class="message"></div>
        
        <div class="info">
            <p><strong>${__('user.advancedFeaturesInfo')}</strong></p>
            <p>${__('user.registrationBenefits')}</p>
        </div>
        
        <div class="login-link">
            ${__('user.alreadyHaveAccount')} <a href="/user/login">${__('user.loginHere')}</a>
        </div>
        
        <a href="/" class="back-link">${__('user.backToHome')}</a>
    </div>

    <script>
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            const callsign = document.getElementById('callsign').value.trim().toUpperCase();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate passwords match
            if (password !== confirmPassword) {
                messageDiv.className = 'message error';
                messageDiv.textContent = '${__('user.passwordMismatch')}';
                messageDiv.style.display = 'block';
                return;
            }
            
            // Validate password length
            if (password.length < 8) {
                messageDiv.className = 'message error';
                messageDiv.textContent = '${__('user.passwordTooShort')}';
                messageDiv.style.display = 'block';
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = '${__('user.registering')}';
            messageDiv.style.display = 'none';
            
            try {
                const response = await fetch('/user/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ callsign, name, email, password }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageDiv.className = 'message success';
                    messageDiv.textContent = data.message;
                    messageDiv.style.display = 'block';
                    document.getElementById('registerForm').reset();
                } else {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = data.error || 'An error occurred';
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = '${__('user.registrationFailed')}';
                messageDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '${__('user.registerButton')}';
            }
        });
    </script>
</body>
</html>
  `);
});

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     description: Submit user registration. A verification email will be sent to activate the account.
 *     tags:
 *       - User Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       200:
 *         description: Registration successful, verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful! Please check your email to verify your account.
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *       400:
 *         description: Invalid request or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Callsign or email already registered
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  try {
    const { callsign, name, email, password } = req.body;
    const locale = res.locals.locale || 'en';

    if (!callsign || !name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Normalize callsign to uppercase
    const normalizedCallsign = callsign.trim().toUpperCase();

    // Check if callsign or email already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE callsign = ? OR email = ?').get(normalizedCallsign, email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Callsign or email already registered',
        message: 'Please use a different callsign or email'
      });
    }

    // Check if there's a pending verification for this email or callsign
    const existingVerification = db.prepare(
      'SELECT * FROM user_verifications WHERE (email = ? OR callsign = ?) AND is_verified = 0 AND expires_at > ?'
    ).get(email, normalizedCallsign, Math.floor(Date.now() / 1000));

    if (existingVerification) {
      // Resend verification email
      const emailSent = await sendVerificationEmail(email, name, existingVerification.verification_token, locale, 'user');
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
      }
      return res.json({ 
        message: 'Verification email resent. Please check your inbox and spam folder.',
        email: email
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours

    // Insert verification record
    const stmt = db.prepare(`
      INSERT INTO user_verifications (callsign, name, email, password_hash, verification_token, expires_at, locale)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(normalizedCallsign, name, email, passwordHash, verificationToken, expiresAt, locale);

    // Send verification email
    const emailSent = await sendVerificationEmail(email, name, verificationToken, locale, 'user');
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
    }

    res.json({ 
      message: 'Registration successful! Please check your email to verify your account.',
      email: email
    });
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /user/verify:
 *   get:
 *     summary: Verify user email address
 *     description: Verify user's email address using the token sent via email. Creates the user account upon successful verification.
 *     tags:
 *       - User Authentication
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token from email
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Email verified successfully, user account created
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid, expired, or already used token
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: Server error
 */
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    const locale = res.locals.locale || 'en';
    const __ = req.__;

    if (!token) {
      return res.status(400).send(`
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${__('user.verificationError')} - Brandmeister Lastheard Next Generation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        .icon { font-size: 64px; margin-bottom: 20px; }
        .error-icon { color: #dc3545; }
        h1 { color: #333; margin-bottom: 20px; font-size: 28px; }
        p { color: #666; margin-bottom: 20px; line-height: 1.6; }
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
        .back-link:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon error-icon">⚠️</div>
        <h1>${__('user.verificationError')}</h1>
        <p>${__('user.verificationTokenRequired')}</p>
        <a href="/user/register" class="back-link">${__('user.registerAgain')}</a>
    </div>
</body>
</html>
      `);
    }

    // Find verification record
    const verification = db.prepare('SELECT * FROM user_verifications WHERE verification_token = ?').get(token);

    if (!verification) {
      return res.status(400).send(`
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${__('user.invalidToken')} - Brandmeister Lastheard Next Generation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        .icon { font-size: 64px; margin-bottom: 20px; }
        .error-icon { color: #dc3545; }
        h1 { color: #333; margin-bottom: 20px; font-size: 28px; }
        p { color: #666; margin-bottom: 20px; line-height: 1.6; }
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
        .back-link:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon error-icon">❌</div>
        <h1>${__('user.invalidToken')}</h1>
        <p>${__('user.invalidTokenMessage')}</p>
        <a href="/user/register" class="back-link">${__('user.registerAgain')}</a>
    </div>
</body>
</html>
      `);
    }

    if (verification.is_verified) {
      return res.status(400).send(`
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${__('user.alreadyVerified')} - Brandmeister Lastheard Next Generation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        .icon { font-size: 64px; margin-bottom: 20px; }
        .warning-icon { color: #ffc107; }
        h1 { color: #333; margin-bottom: 20px; font-size: 28px; }
        p { color: #666; margin-bottom: 20px; line-height: 1.6; }
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
        .back-link:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon warning-icon">ℹ️</div>
        <h1>${__('user.alreadyVerified')}</h1>
        <p>${__('user.alreadyVerifiedMessage')}</p>
        <a href="/user/login" class="back-link">${__('user.loginNow')}</a>
    </div>
</body>
</html>
      `);
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (verification.expires_at < currentTime) {
      return res.status(400).send(`
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${__('user.tokenExpired')} - Brandmeister Lastheard Next Generation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        .icon { font-size: 64px; margin-bottom: 20px; }
        .warning-icon { color: #ffc107; }
        h1 { color: #333; margin-bottom: 20px; font-size: 28px; }
        p { color: #666; margin-bottom: 20px; line-height: 1.6; }
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
        .back-link:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon warning-icon">⏱️</div>
        <h1>${__('user.tokenExpired')}</h1>
        <p>${__('user.tokenExpiredMessage')}</p>
        <a href="/user/register" class="back-link">${__('user.registerAgain')}</a>
    </div>
</body>
</html>
      `);
    }

    // Create user account
    const insertStmt = db.prepare(`
      INSERT INTO users (callsign, name, email, password_hash, is_active, locale)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    insertStmt.run(verification.callsign, verification.name, verification.email, verification.password_hash, verification.locale);

    // Mark verification as complete
    const updateStmt = db.prepare('UPDATE user_verifications SET is_verified = 1 WHERE id = ?');
    updateStmt.run(verification.id);

    res.send(`
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${__('user.accountVerified')} - Brandmeister Lastheard Next Generation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        .icon { font-size: 64px; margin-bottom: 20px; }
        .success-icon { color: #28a745; }
        h1 { color: #333; margin-bottom: 20px; font-size: 28px; }
        p { color: #666; margin-bottom: 20px; line-height: 1.6; }
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
        .back-link:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon success-icon">✅</div>
        <h1>${__('user.accountVerified')}</h1>
        <p>${__('user.accountVerifiedMessage')}</p>
        <a href="/user/login" class="back-link">${__('user.loginNow')}</a>
    </div>
</body>
</html>
    `);
  } catch (error) {
    console.error('Error in user verification:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * User login form
 */
router.get('/login', (req, res) => {
  const locale = res.locals.locale || 'en';
  const __ = req.__;
  
  res.send(`
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${__('user.loginTitle')} - Brandmeister Lastheard Next Generation</title>
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
        .register-link {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
        .register-link a {
            color: #667eea;
            text-decoration: none;
        }
        .register-link a:hover {
            text-decoration: underline;
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
        <h1>${__('user.loginTitle')}</h1>
        <p class="subtitle">${__('user.loginSubtitle')}</p>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="callsign">${__('user.callsign')} *</label>
                <input type="text" id="callsign" name="callsign" required placeholder="${__('user.callsignPlaceholder')}">
            </div>
            
            <div class="form-group">
                <label for="password">${__('user.password')} *</label>
                <input type="password" id="password" name="password" required placeholder="${__('user.passwordPlaceholder')}">
            </div>
            
            <button type="submit" id="submitBtn">${__('user.loginButton')}</button>
        </form>
        
        <div id="message" class="message"></div>
        
        <div class="register-link">
            ${__('user.noAccount')} <a href="/user/register">${__('user.registerHere')}</a>
        </div>
        
        <a href="/" class="back-link">${__('user.backToHome')}</a>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            const callsign = document.getElementById('callsign').value.trim().toUpperCase();
            const password = document.getElementById('password').value;
            
            submitBtn.disabled = true;
            submitBtn.textContent = '${__('user.loggingIn')}';
            messageDiv.style.display = 'none';
            
            try {
                const response = await fetch('/user/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ callsign, password }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageDiv.className = 'message success';
                    messageDiv.textContent = '${__('user.loginSuccess')}';
                    messageDiv.style.display = 'block';
                    // Redirect to home page after 1 second
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = data.error || '${__('user.loginFailed')}';
                    messageDiv.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = '${__('user.loginButton')}';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = '${__('user.loginFailed')}';
                messageDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = '${__('user.loginButton')}';
            }
        });
    </script>
</body>
</html>
  `);
});

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with callsign and password. Creates a session and updates last_login_at timestamp.
 *     tags:
 *       - User Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful, session cookie set
 *         headers:
 *           Set-Cookie:
 *             description: Session token cookie (HTTP-only)
 *             schema:
 *               type: string
 *               example: session_token=550e8400-e29b-41d4-a716-446655440000; Path=/; HttpOnly; Max-Age=2592000
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     callsign:
 *                       type: string
 *                       example: EA7KLK
 *                     name:
 *                       type: string
 *                       example: John Doe
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid callsign or password
 *       403:
 *         description: Account not active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Account is not active. Please verify your email or contact support.
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { callsign, password } = req.body;

    if (!callsign || !password) {
      return res.status(400).json({ error: 'Callsign and password are required' });
    }

    // Normalize callsign to uppercase
    const normalizedCallsign = callsign.trim().toUpperCase();

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE callsign = ?').get(normalizedCallsign);

    if (!user) {
      return res.status(401).json({ error: 'Invalid callsign or password' });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is not active. Please verify your email or contact support.' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid callsign or password' });
    }

    // Create session
    const sessionToken = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

    const stmt = db.prepare(`
      INSERT INTO user_sessions (session_token, user_id, expires_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(sessionToken, user.id, expiresAt);

    // Update last login time
    const updateStmt = db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?');
    updateStmt.run(Math.floor(Date.now() / 1000), user.id);

    // Set session cookie
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax'
    });

    res.json({ 
      message: 'Login successful',
      user: {
        callsign: user.callsign,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user by deleting the session and clearing the session cookie
 *     tags:
 *       - User Authentication
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       500:
 *         description: Server error
 */
router.post('/logout', (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;

    if (sessionToken) {
      // Delete session from database
      const stmt = db.prepare('DELETE FROM user_sessions WHERE session_token = ?');
      stmt.run(sessionToken);
    }

    // Clear session cookie
    res.clearCookie('session_token');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error in user logout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
