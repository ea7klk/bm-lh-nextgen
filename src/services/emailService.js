const nodemailer = require('nodemailer');
const i18n = require('../config/i18n');

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Email security settings
const EMAIL_SECURE = process.env.EMAIL_SECURE !== undefined 
  ? process.env.EMAIL_SECURE === 'true' 
  : parseInt(EMAIL_PORT) === 465;
const EMAIL_REQUIRE_TLS = process.env.EMAIL_REQUIRE_TLS === 'true';

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
      secure: EMAIL_SECURE, // Use configured secure setting
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    };

    // Add requireTLS option if configured
    if (EMAIL_REQUIRE_TLS) {
      transporterConfig.requireTLS = true;
    }

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

async function sendVerificationEmail(email, name, verificationToken, locale = 'en') {
  if (!transporter) {
    console.error('Email transporter not available. Please check email configuration.');
    return false;
  }

  // Set locale for translations
  i18n.setLocale(locale);

  const verificationLink = `${BASE_URL}/api/auth/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: i18n.__('email.verifyEmailSubject'),
    html: `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${i18n.__('email.verifyEmailTitle')}</title>
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
                            <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">${i18n.__('email.verifyEmailTitle')}</h2>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px; font-size: 16px;">${i18n.__('email.hello')} ${name},</p>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">${i18n.__('email.verifyEmailBody')}</p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="${verificationLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">${i18n.__('email.verifyButton')}</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #999999; line-height: 1.6; margin: 0 0 20px; font-size: 14px;">${i18n.__('email.buttonNotWork')}</p>
                            
                            <p style="color: #667eea; line-height: 1.6; margin: 0 0 30px; font-size: 14px; word-break: break-all;">${verificationLink}</p>
                            
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 6px; margin: 0 0 30px;">
                                <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;"><strong>⏱️ ${i18n.__('email.linkExpires')}</strong></p>
                            </div>
                            
                            <p style="color: #999999; line-height: 1.6; margin: 0; font-size: 14px;">${i18n.__('email.didNotRequest')}</p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 14px; line-height: 1.6;">${i18n.__('email.brandmeisterApi')}</p>
                            <p style="color: #999999; margin: 10px 0 0; font-size: 12px;">${i18n.__('email.automatedEmail')}</p>
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
${i18n.__('email.brandmeisterApi')}
${i18n.__('email.verifyEmailTitle')}

${i18n.__('email.hello')} ${name},

${i18n.__('email.verifyEmailBody')}

${verificationLink}

⏱️ ${i18n.__('email.linkExpires')}

${i18n.__('email.didNotRequest')}

---
${i18n.__('email.brandmeisterApi')}
${i18n.__('email.automatedEmail')}
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

async function sendApiKeyEmail(email, name, apiKey, locale = 'en') {
  if (!transporter) {
    console.error('Email transporter not available. Please check email configuration.');
    return false;
  }

  // Set locale for translations
  i18n.setLocale(locale);

  // Calculate expiry date (365 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 365);
  
  // Use locale-specific date formatting
  const localeMap = { 'en': 'en-US', 'es': 'es-ES', 'de': 'de-DE', 'fr': 'fr-FR' };
  const expiryDateFormatted = expiryDate.toLocaleDateString(localeMap[locale] || 'en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: i18n.__('email.apiKeyReadySubject'),
    html: `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${i18n.__('email.apiKeyReadyTitle')}</title>
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
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">${i18n.__('email.apiKeyReadyTitle')}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">${i18n.__('email.hello')} ${name},</p>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px; font-size: 16px;">${i18n.__('email.emailVerifiedSuccess')}</p>
                            
                            <!-- API Key Box -->
                            <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                                <p style="color: #666666; margin: 0 0 10px; font-size: 14px; font-weight: 600; text-transform: uppercase;">${i18n.__('email.yourApiKey')}</p>
                                <p style="color: #333333; margin: 0; font-family: 'Courier New', monospace; font-size: 16px; word-break: break-all; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0;">${apiKey}</p>
                            </div>

                            <!-- Expiry Info -->
                            <div style="background-color: #f0f0f0; border-radius: 6px; padding: 12px; margin: 0 0 30px; text-align: center;">
                                <p style="color: #666666; margin: 0; font-size: 14px;"><strong>${i18n.__('email.validUntil')}</strong> ${expiryDateFormatted}</p>
                            </div>
                            
                            <!-- Warning Box -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 6px; margin: 0 0 30px;">
                                <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;"><strong>⚠️ ${i18n.__('email.importantWarning')}</strong> ${i18n.__('email.keepSafe')}</p>
                            </div>
                            
                            <!-- Usage Instructions -->
                            <h3 style="color: #333333; margin: 0 0 15px; font-size: 18px;">${i18n.__('email.howToUseTitle')}</h3>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 15px; font-size: 14px;">${i18n.__('email.includeKeyInHeader')} <code style="background-color: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace;">X-API-Key</code> ${i18n.__('email.headerText')}</p>
                            
                            <!-- Example Code -->
                            <div style="background-color: #2d2d2d; border-radius: 6px; padding: 16px; margin: 0 0 30px; overflow-x: auto;">
                                <pre style="color: #ffffff; margin: 0; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6;">curl -H "X-API-Key: ${apiKey}" \\
     ${BASE_URL}/api/lastheard</pre>
                            </div>
                            
                            <!-- Info Box -->
                            <div style="background-color: #e7f3ff; border-left: 4px solid #667eea; padding: 16px; border-radius: 6px; margin: 0 0 30px;">
                                <p style="color: #333333; margin: 0 0 10px; font-size: 14px; line-height: 1.6;"><strong>📚 ${i18n.__('email.apiDocumentation')}</strong></p>
                                <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">${i18n.__('email.visitDocs')} <a href="${BASE_URL}/api-docs" style="color: #667eea; text-decoration: none;">${BASE_URL}/api-docs</a> ${i18n.__('email.forCompleteDocs')}</p>
                            </div>
                            
                            <p style="color: #999999; line-height: 1.6; margin: 0; font-size: 14px;">${i18n.__('email.questionsContact')}</p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 14px; line-height: 1.6;">${i18n.__('email.brandmeisterApi')}</p>
                            <p style="color: #999999; margin: 10px 0 0; font-size: 12px;">${i18n.__('email.automatedEmail')}</p>
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
${i18n.__('email.brandmeisterApi')}
🎉 ${i18n.__('email.apiKeyReadyTitle')}

${i18n.__('email.hello')} ${name},

${i18n.__('email.emailVerifiedSuccess')}

${i18n.__('email.yourApiKey').toUpperCase()}:
${apiKey}

${i18n.__('email.validUntil')} ${expiryDateFormatted}

⚠️ ${i18n.__('email.importantWarning').toUpperCase()}: ${i18n.__('email.keepSafe')}

${i18n.__('email.howToUseTitle').toUpperCase()}
${i18n.__('email.includeKeyInHeader')} X-API-Key ${i18n.__('email.headerText')}

Example:
curl -H "X-API-Key: ${apiKey}" \\
     ${BASE_URL}/api/lastheard

📚 ${i18n.__('email.apiDocumentation')}
${i18n.__('email.visitDocs')} ${BASE_URL}/api-docs ${i18n.__('email.forCompleteDocs')}

${i18n.__('email.questionsContact')}

---
${i18n.__('email.brandmeisterApi')}
${i18n.__('email.automatedEmail')}
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
  // Check for configuration issues first
  const configIssues = [];
  
  if (!EMAIL_USER || EMAIL_USER === '') {
    configIssues.push('EMAIL_USER is not set');
  }
  
  if (!EMAIL_PASSWORD || EMAIL_PASSWORD === '') {
    configIssues.push('EMAIL_PASSWORD is not set');
  }
  
  if (EMAIL_HOST === 'smtp.example.com') {
    configIssues.push('EMAIL_HOST is using default value (smtp.example.com) - please configure your actual SMTP server');
  }
  
  if (!EMAIL_HOST || EMAIL_HOST === '') {
    configIssues.push('EMAIL_HOST is not set');
  }
  
  if (!EMAIL_PORT || EMAIL_PORT === '') {
    configIssues.push('EMAIL_PORT is not set');
  }
  
  if (!EMAIL_FROM || EMAIL_FROM === '' || EMAIL_FROM === 'noreply@example.com') {
    configIssues.push('EMAIL_FROM is not set or using default value');
  }
  
  // If there are configuration issues, return them
  if (configIssues.length > 0) {
    return {
      success: false,
      error: 'Email configuration is incomplete or invalid',
      details: configIssues,
      errorType: 'configuration'
    };
  }
  
  // Check if transporter was created
  if (!transporter) {
    return {
      success: false,
      error: 'Email transporter could not be created',
      details: ['The email transporter initialization failed. This usually means there was an error validating the configuration.'],
      errorType: 'transporter'
    };
  }

  // Try to verify the connection
  try {
    await transporter.verify();
    return {
      success: true,
      message: 'Email configuration is valid and connection test passed',
      details: ['Successfully connected to SMTP server', 'Authentication verified']
    };
  } catch (error) {
    // Provide detailed error information
    const errorDetails = {
      success: false,
      error: error.message,
      errorType: 'connection',
      details: []
    };
    
    // Add error code if available
    if (error.code) {
      errorDetails.errorCode = error.code;
      errorDetails.details.push(`Error code: ${error.code}`);
    }
    
    // Add command if available (shows which SMTP command failed)
    if (error.command) {
      errorDetails.details.push(`Failed during: ${error.command}`);
    }
    
    // Add response code if available
    if (error.responseCode) {
      errorDetails.details.push(`SMTP response code: ${error.responseCode}`);
    }
    
    // Add response if available
    if (error.response) {
      errorDetails.details.push(`Server response: ${error.response}`);
    }
    
    // Add stack trace for debugging
    if (error.stack) {
      errorDetails.stackTrace = error.stack;
    }
    
    // Provide specific guidance based on error type
    if (error.code === 'EAUTH') {
      errorDetails.details.push('Authentication failed - check your EMAIL_USER and EMAIL_PASSWORD');
      errorDetails.details.push('For Gmail: Use App Password instead of regular password');
      errorDetails.details.push('For Gmail: Enable 2-factor authentication first');
    } else if (error.code === 'ECONNECTION' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      errorDetails.details.push('Connection failed - check EMAIL_HOST and EMAIL_PORT');
      errorDetails.details.push('Verify your internet connection');
      errorDetails.details.push('Check if firewall or antivirus is blocking the connection');
    } else if (error.code === 'ESOCKET') {
      errorDetails.details.push('Socket error - connection was interrupted');
      errorDetails.details.push('This may be a temporary network issue');
    } else if (error.code === 'EENVELOPE') {
      errorDetails.details.push('Invalid email address in EMAIL_FROM');
    }
    
    return errorDetails;
  }
}

async function sendExpiryReminderEmail(email, name, apiKey, daysUntilExpiry, expiresAt, locale = 'en') {
  if (!transporter) {
    console.error('Email transporter not available. Please check email configuration.');
    return false;
  }

  // Set locale for translations
  i18n.setLocale(locale);

  // Use locale-specific date formatting
  const localeMap = { 'en': 'en-US', 'es': 'es-ES', 'de': 'de-DE', 'fr': 'fr-FR' };
  const expiryDate = new Date(expiresAt * 1000).toLocaleDateString(localeMap[locale] || 'en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: i18n.__('email.expiryReminderSubject', { days: daysUntilExpiry }),
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
