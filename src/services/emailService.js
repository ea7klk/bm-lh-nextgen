const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Validate email configuration
function validateEmailConfig() {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error('Email configuration is incomplete. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
  }
  
  if (EMAIL_HOST === 'smtp.example.com') {
    throw new Error('Email configuration is using default values. Please configure EMAIL_HOST and other email settings.');
  }
}

// Create transporter with better error handling
function createTransporter() {
  try {
    validateEmailConfig();
    
    const transporterConfig = {
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT),
      secure: parseInt(EMAIL_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    };

    // Gmail specific configuration
    if (EMAIL_HOST.includes('gmail')) {
      transporterConfig.service = 'gmail';
    }
    
    return nodemailer.createTransport(transporterConfig);
  } catch (error) {
    console.error('Error creating email transporter:', error.message);
    return null;
  }
}

const transporter = createTransporter();

async function sendVerificationEmail(email, name, verificationToken) {
  if (!transporter) {
    console.error('Email transporter not available. Please check email configuration.');
    return false;
  }

  const verificationLink = `${BASE_URL}/api/auth/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your email for API key',
    html: `
      <h2>Welcome to Brandmeister Lastheard Next Generation API</h2>
      <p>Hello ${name},</p>
      <p>Thank you for requesting an API key. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
    text: `
      Welcome to Brandmeister Lastheard Next Generation API
      
      Hello ${name},
      
      Thank you for requesting an API key. Please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you did not request this, please ignore this email.
    `,
  };

  try {
    // Test the connection before sending
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    
    // Provide specific error messages for common issues
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check:');
      console.error('1. Email credentials (EMAIL_USER and EMAIL_PASSWORD)');
      console.error('2. For Gmail: Use App Password instead of regular password');
      console.error('3. For Gmail: Enable 2-factor authentication and generate App Password');
      console.error('4. For other providers: Check if less secure app access is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Please check:');
      console.error('1. Email host and port settings');
      console.error('2. Internet connection');
      console.error('3. Firewall settings');
    }
    
    return false;
  }
}

async function sendApiKeyEmail(email, name, apiKey) {
  if (!transporter) {
    console.error('Email transporter not available. Please check email configuration.');
    return false;
  }

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Your API key for Brandmeister Lastheard Next Generation',
    html: `
      <h2>Your API Key is Ready!</h2>
      <p>Hello ${name},</p>
      <p>Your email has been verified. Here is your API key:</p>
      <p><strong>${apiKey}</strong></p>
      <p>Please keep this API key safe and do not share it with others.</p>
      <p>To use the API, include the API key in the <code>X-API-Key</code> header of your requests.</p>
      <p>Example:</p>
      <pre>
curl -H "X-API-Key: ${apiKey}" ${BASE_URL}/api/lastheard
      </pre>
    `,
    text: `
      Your API Key is Ready!
      
      Hello ${name},
      
      Your email has been verified. Here is your API key:
      
      ${apiKey}
      
      Please keep this API key safe and do not share it with others.
      
      To use the API, include the API key in the X-API-Key header of your requests.
      
      Example:
      curl -H "X-API-Key: ${apiKey}" ${BASE_URL}/api/lastheard
    `,
  };

  try {
    // Test the connection before sending
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log(`API key email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending API key email:', error);
    
    // Provide specific error messages for common issues
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check email configuration.');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Please check network and email server settings.');
    }
    
    return false;
  }
}

// Test email configuration
async function testEmailConfig() {
  if (!transporter) {
    return { success: false, error: 'Email transporter not available' };
  }

  try {
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendApiKeyEmail,
  testEmailConfig,
};
