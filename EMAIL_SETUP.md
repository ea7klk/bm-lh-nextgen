# Email Configuration Guide

This guide helps you configure email settings for the Brandmeister Lastheard Next Generation API.

## Quick Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your email provider settings (see below for specific providers).

3. Restart the application for changes to take effect.

## Email Provider Configurations

### Gmail

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"

3. Update your `.env` file:
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

### Outlook/Hotmail

1. Update your `.env` file:
   ```bash
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASSWORD=your-password
   EMAIL_FROM=your-email@outlook.com
   ```

### Yahoo Mail

1. Enable App Passwords in Yahoo Account Security
2. Generate a new app password

3. Update your `.env` file:
   ```bash
   EMAIL_HOST=smtp.mail.yahoo.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@yahoo.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=your-email@yahoo.com
   ```

### Custom SMTP Server

```bash
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

## Common Issues and Solutions

### Emails Failing Despite Correct Credentials

**Cause:** Some SMTP servers don't properly implement the EHLO command used for connection verification

**Solution:**
- The application no longer uses blocking `verify()` calls before sending emails
- Email sending now happens directly through `sendMail()` which handles its own connection
- Use the `test-email.js` script to test your configuration separately
- If emails still fail, check the application logs for specific error codes

### Authentication Failed (Error 535)

**Cause:** Incorrect credentials or security settings

**Solutions:**
1. **Gmail:** Use App Password instead of regular password
2. **Yahoo:** Enable App Password in security settings
3. **Outlook:** Ensure account has SMTP access enabled
4. **Custom servers:** Verify username/password and server settings

### Connection Timeout

**Cause:** Network or firewall issues

**Solutions:**
1. Check firewall settings
2. Try different ports (587, 465, 25)
3. Verify internet connection
4. Check if ISP blocks SMTP

### SSL/TLS Errors

**Cause:** Certificate or encryption issues

**Solutions:**
1. Try different ports (587 for STARTTLS, 465 for SSL)
2. Check if email provider supports the encryption method
3. For development, you can disable certificate verification (already configured)

### AUTH PLAIN Failures

**Cause:** SMTP server requires STARTTLS before authentication

**Solutions:**
1. Set `EMAIL_REQUIRE_TLS=true` in your `.env` file
2. Ensure you're using port 587 (STARTTLS port) not 465 (SSL port)
3. Verify your SMTP server supports STARTTLS

Example configuration for servers requiring STARTTLS:
```bash
EMAIL_HOST=mail.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_REQUIRE_TLS=true
```

## Testing Email Configuration

You can test your email configuration by creating a simple test script:

```javascript
const { testEmailConfig } = require('./src/services/emailService');

async function test() {
  const result = await testEmailConfig();
  console.log(result);
}

test();
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use App Passwords** when available instead of account passwords
3. **Enable 2-factor authentication** on email accounts
4. **Regularly rotate** email passwords and app passwords
5. **Use environment-specific** email settings for development/production

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | `smtp.example.com` |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | Email username/address | `` |
| `EMAIL_PASSWORD` | Email password/app password | `` |
| `EMAIL_FROM` | From address for outgoing emails | `noreply@example.com` |
| `BASE_URL` | Base URL for email links | `http://localhost:3000` |
| `EMAIL_SECURE` | Use direct SSL/TLS connection (true/false) | Auto-detected based on port (true for 465, false otherwise) |
| `EMAIL_REQUIRE_TLS` | Require STARTTLS before authentication (true/false) | `false` |

### Email Security Settings

**EMAIL_SECURE**: Controls whether to use a direct SSL/TLS connection or start with a plain connection.
- Set to `true` for port 465 (direct SSL/TLS)
- Set to `false` for port 587 (STARTTLS)
- If not set, automatically determined based on the port

**EMAIL_REQUIRE_TLS**: Forces the use of STARTTLS for non-secure connections.
- Set to `true` if your SMTP server requires STARTTLS before authentication
- This is useful when the server rejects AUTH PLAIN without STARTTLS
- Default is `false`

### When to Use EMAIL_REQUIRE_TLS

If you see errors like:
- `Failed during: AUTH PLAIN`
- `AUTH command failed`
- `Must issue a STARTTLS command first`

Try setting `EMAIL_REQUIRE_TLS=true` in your `.env` file:

```bash
EMAIL_REQUIRE_TLS=true
```

## Troubleshooting

If you're still experiencing issues:

1. Check the application logs for specific error messages
2. Verify your email provider's SMTP settings documentation
3. Test with a simple email client first
4. Ensure your hosting environment allows outbound SMTP connections
5. Contact your email provider's support if authentication continues to fail