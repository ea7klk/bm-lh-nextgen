#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * 
 * This script helps test your email configuration before running the main application.
 * Run this script after setting up your .env file to verify email settings work.
 * 
 * Usage: node test-email.js
 */

require('dotenv').config();
const { testEmailConfig } = require('./src/services/emailService');

async function runEmailTest() {
  console.log('🧪 Testing email configuration...\n');
  
  // Display current configuration (without password)
  console.log('Current email configuration:');
  console.log(`  Host: ${process.env.EMAIL_HOST || 'Not set'}`);
  console.log(`  Port: ${process.env.EMAIL_PORT || 'Not set'}`);
  console.log(`  User: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`  Password: ${process.env.EMAIL_PASSWORD ? '***SET***' : 'Not set'}`);
  console.log(`  From: ${process.env.EMAIL_FROM || 'Not set'}\n`);
  
  // Test the configuration
  const result = await testEmailConfig();
  
  if (result.success) {
    console.log('✅ Email configuration test PASSED!');
    console.log(`   ${result.message}`);
    
    // Show additional success details if available
    if (result.details && result.details.length > 0) {
      console.log('\n📋 Details:');
      result.details.forEach(detail => {
        console.log(`   ✓ ${detail}`);
      });
    }
    
    console.log('\n🎉 Your email settings are working correctly.');
    console.log('   You can now start the main application.');
  } else {
    console.log('❌ Email configuration test FAILED!');
    console.log(`   Error: ${result.error}`);
    
    // Show error type if available
    if (result.errorType) {
      console.log(`   Error type: ${result.errorType}`);
    }
    
    // Show error code if available
    if (result.errorCode) {
      console.log(`   Error code: ${result.errorCode}`);
    }
    
    // Show detailed error information
    if (result.details && result.details.length > 0) {
      console.log('\n📋 Detailed Error Information:');
      result.details.forEach(detail => {
        console.log(`   • ${detail}`);
      });
    }
    
    // Show stack trace in verbose mode (if VERBOSE env var is set)
    if (process.env.VERBOSE === 'true' && result.stackTrace) {
      console.log('\n🔍 Stack Trace (for debugging):');
      console.log(result.stackTrace);
    }
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Check your email settings in the .env file');
    console.log('   2. See EMAIL_SETUP.md for detailed configuration instructions');
    
    // Provide specific guidance based on error type
    if (result.errorType === 'configuration') {
      console.log('\n💡 Configuration Help:');
      console.log('   - Copy .env.example to .env if you haven\'t already');
      console.log('   - Fill in all required email settings');
      console.log('   - Make sure no values are left as "example.com" defaults');
    } else if (result.errorType === 'connection' || result.errorCode === 'EAUTH') {
      console.log('\n💡 Common Solutions:');
      if (result.errorCode === 'EAUTH') {
        console.log('   - For Gmail: Use App Password, not regular password');
        console.log('   - For Gmail: Enable 2-factor authentication first');
        console.log('   - For Yahoo: Enable App Password in security settings');
        console.log('   - For Outlook: Verify SMTP access is enabled');
        console.log('   - Double-check your EMAIL_USER and EMAIL_PASSWORD');
      } else {
        console.log('   - Verify EMAIL_HOST is correct (e.g., smtp.gmail.com)');
        console.log('   - Verify EMAIL_PORT (usually 587 for TLS or 465 for SSL)');
        console.log('   - Check your internet connection');
        console.log('   - Check firewall/antivirus settings');
      }
    }
    
    console.log('\n💻 For verbose error output, run: VERBOSE=true node test-email.js');
  }
  
  console.log('\n📖 For detailed setup instructions, see EMAIL_SETUP.md');
  process.exit(result.success ? 0 : 1);
}

// Handle script execution
if (require.main === module) {
  runEmailTest().catch(error => {
    console.error('❌ Unexpected error during email test:');
    console.error(`   ${error.message}`);
    
    // Show additional error details if available
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    
    // Show stack trace in verbose mode
    if (process.env.VERBOSE === 'true' && error.stack) {
      console.error('\n🔍 Stack Trace:');
      console.error(error.stack);
    } else {
      console.error('\n💻 For verbose error output, run: VERBOSE=true node test-email.js');
    }
    
    process.exit(1);
  });
}