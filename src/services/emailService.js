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
    subject: 'Verify your email for Brandmeister Lastheard API',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Brandmeister Lastheard</h1>
                            <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Next Generation API</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">Verify Your Email</h2>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px; font-size: 16px;">Hello ${name},</p>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">Thank you for requesting an API key for the Brandmeister Lastheard Next Generation API. To complete your registration and receive your API key, please verify your email address by clicking the button below:</p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="${verificationLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Verify Email Address</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #999999; line-height: 1.6; margin: 0 0 20px; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                            
                            <p style="color: #667eea; line-height: 1.6; margin: 0 0 30px; font-size: 14px; word-break: break-all;">${verificationLink}</p>
                            
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 6px; margin: 0 0 30px;">
                                <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;"><strong>⏱️ This link will expire in 24 hours.</strong></p>
                            </div>
                            
                            <p style="color: #999999; line-height: 1.6; margin: 0; font-size: 14px;">If you did not request an API key, please ignore this email.</p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 14px; line-height: 1.6;">Brandmeister Lastheard Next Generation API</p>
                            <p style="color: #999999; margin: 10px 0 0; font-size: 12px;">This is an automated email. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    text: `
Brandmeister Lastheard Next Generation API
Verify Your Email

Hello ${name},

Thank you for requesting an API key for the Brandmeister Lastheard Next Generation API. To complete your registration and receive your API key, please verify your email address by clicking the link below:

${verificationLink}

⏱️ This link will expire in 24 hours.

If you did not request an API key, please ignore this email.

---
Brandmeister Lastheard Next Generation API
This is an automated email. Please do not reply.
    `,
  };

  try {
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

  // Calculate expiry date (365 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 365);
  const expiryDateFormatted = expiryDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Your Brandmeister Lastheard API Key',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your API Key</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Your API Key is Ready!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">Hello ${name},</p>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">Your email has been verified successfully! Here is your API key for accessing the Brandmeister Lastheard Next Generation API:</p>
                            
                            <!-- API Key Box -->
                            <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                                <p style="color: #666666; margin: 0 0 10px; font-size: 14px; font-weight: 600; text-transform: uppercase;">Your API Key</p>
                                <p style="color: #333333; margin: 0; font-family: 'Courier New', monospace; font-size: 16px; word-break: break-all; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0;">${apiKey}</p>
                            </div>

                            <!-- Expiry Info -->
                            <div style="background-color: #f0f0f0; border-radius: 6px; padding: 12px; margin: 0 0 30px; text-align: center;">
                                <p style="color: #666666; margin: 0; font-size: 14px;"><strong>Valid until:</strong> ${expiryDateFormatted}</p>
                            </div>
                            
                            <!-- Warning Box -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 6px; margin: 0 0 30px;">
                                <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;"><strong>⚠️ Important:</strong> Please keep this API key safe and do not share it with others. You will receive reminder emails before expiration.</p>
                            </div>
                            
                            <!-- Usage Instructions -->
                            <h3 style="color: #333333; margin: 0 0 15px; font-size: 18px;">How to Use Your API Key</h3>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 15px; font-size: 14px;">Include your API key in the <code style="background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace;">X-API-Key</code> header with all API requests.</p>
                            
                            <!-- Example Code -->
                            <div style="background-color: #2d2d2d; border-radius: 6px; padding: 16px; margin: 0 0 30px; overflow-x: auto;">
                                <pre style="color: #ffffff; margin: 0; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6;">curl -H "X-API-Key: ${apiKey}" \\
     ${BASE_URL}/api/lastheard</pre>
                            </div>
                            
                            <!-- Info Box -->
                            <div style="background-color: #e7f3ff; border-left: 4px solid #667eea; padding: 16px; border-radius: 6px; margin: 0 0 30px;">
                                <p style="color: #333333; margin: 0 0 10px; font-size: 14px; line-height: 1.6;"><strong>📚 API Documentation</strong></p>
                                <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">Visit <a href="${BASE_URL}/api-docs" style="color: #667eea; text-decoration: none;">${BASE_URL}/api-docs</a> for complete API documentation.</p>
                            </div>
                            
                            <p style="color: #999999; line-height: 1.6; margin: 0; font-size: 14px;">If you have any questions or need assistance, feel free to reach out to our support team.</p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 14px; line-height: 1.6;">Brandmeister Lastheard Next Generation API</p>
                            <p style="color: #999999; margin: 10px 0 0; font-size: 12px;">This is an automated email. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    text: `
Brandmeister Lastheard Next Generation API
🎉 Your API Key is Ready!

Hello ${name},

Your email has been verified successfully! Here is your API key for accessing the Brandmeister Lastheard Next Generation API:

YOUR API KEY:
${apiKey}

Valid until: ${expiryDateFormatted}

⚠️ IMPORTANT: Please keep this API key safe and do not share it with others. You will receive reminder emails before expiration.

HOW TO USE YOUR API KEY
Include your API key in the X-API-Key header with all API requests.

Example:
curl -H "X-API-Key: ${apiKey}" \\
     ${BASE_URL}/api/lastheard

📚 API Documentation
Visit ${BASE_URL}/api-docs for complete API documentation.

If you have any questions or need assistance, feel free to reach out to our support team.

---
Brandmeister Lastheard Next Generation API
This is an automated email. Please do not reply.
    `,
  };

  try {
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

async function sendExpiryReminderEmail(email, name, apiKey, daysUntilExpiry, expiresAt) {
  if (!transporter) {
    console.error('Email transporter not available. Please check email configuration.');
    return false;
  }

  const expiryDate = new Date(expiresAt * 1000).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: `Your Brandmeister API Key Expires in ${daysUntilExpiry} Days`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Key Expiry Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); padding: 40px 40px 30px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">API Key Expiring Soon</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">Hello ${name},</p>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">This is a friendly reminder that your Brandmeister Lastheard API key will expire in <strong>${daysUntilExpiry} days</strong>.</p>
                            
                            <!-- Expiry Info Box -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 6px; margin: 0 0 30px;">
                                <p style="color: #856404; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Expiration Date</p>
                                <p style="color: #856404; margin: 0; font-size: 20px; font-weight: 700;">${expiryDate}</p>
                            </div>
                            
                            <!-- API Key Box -->
                            <div style="background-color: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                                <p style="color: #666666; margin: 0 0 10px; font-size: 14px; font-weight: 600; text-transform: uppercase;">Your API Key</p>
                                <p style="color: #333333; margin: 0; font-family: 'Courier New', monospace; font-size: 14px; word-break: break-all; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0;">${apiKey}</p>
                            </div>
                            
                            <!-- Action Required -->
                            <h3 style="color: #333333; margin: 0 0 15px; font-size: 18px;">What You Need to Do</h3>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px; font-size: 14px;">To continue using the Brandmeister Lastheard API after the expiration date, you will need to request a new API key.</p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="${BASE_URL}/api/auth/request-key" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Request New API Key</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <div style="background-color: #e7f3ff; border-left: 4px solid #667eea; padding: 16px; border-radius: 6px; margin: 0 0 20px;">
                                <p style="color: #333333; margin: 0; font-size: 14px; line-height: 1.6;"><strong>💡 Tip:</strong> Request your new API key before the expiration date to avoid any service interruption.</p>
                            </div>
                            
                            <p style="color: #999999; line-height: 1.6; margin: 0; font-size: 14px;">If you have any questions, please don't hesitate to contact us.</p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 14px; line-height: 1.6;">Brandmeister Lastheard Next Generation API</p>
                            <p style="color: #999999; margin: 10px 0 0; font-size: 12px;">This is an automated email. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    text: `
Brandmeister Lastheard Next Generation API
⏰ API Key Expiring Soon

Hello ${name},

This is a friendly reminder that your Brandmeister Lastheard API key will expire in ${daysUntilExpiry} days.

EXPIRATION DATE: ${expiryDate}

YOUR API KEY:
${apiKey}

WHAT YOU NEED TO DO
To continue using the Brandmeister Lastheard API after the expiration date, you will need to request a new API key.

Request a new API key at: ${BASE_URL}/api/auth/request-key

💡 Tip: Request your new API key before the expiration date to avoid any service interruption.

If you have any questions, please don't hesitate to contact us.

---
Brandmeister Lastheard Next Generation API
This is an automated email. Please do not reply.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Expiry reminder email sent to ${email} (${daysUntilExpiry} days until expiry)`);
    return true;
  } catch (error) {
    console.error('Error sending expiry reminder email:', error);
    return false;
  }
}

module.exports = {
  sendVerificationEmail,
  sendApiKeyEmail,
  sendExpiryReminderEmail,
  testEmailConfig,
};
