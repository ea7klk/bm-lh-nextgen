const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT == 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

async function sendVerificationEmail(email, name, verificationToken) {
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
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

async function sendApiKeyEmail(email, name, apiKey) {
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
    await transporter.sendMail(mailOptions);
    console.log(`API key email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending API key email:', error);
    return false;
  }
}

module.exports = {
  sendVerificationEmail,
  sendApiKeyEmail,
};
