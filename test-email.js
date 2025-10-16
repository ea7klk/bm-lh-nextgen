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
    console.log('\n🎉 Your email settings are working correctly.');
    console.log('   You can now start the main application.');
  } else {
    console.log('❌ Email configuration test FAILED!');
    console.log(`   Error: ${result.error}`);
    console.log('\n🔧 Please check your email settings in the .env file.');
    console.log('   See EMAIL_SETUP.md for detailed configuration instructions.');
    
    // Provide specific guidance based on error
    if (result.error.includes('authentication')) {
      console.log('\n💡 Authentication tips:');
      console.log('   - For Gmail: Use App Password, not regular password');
      console.log('   - For Yahoo: Enable App Password in security settings');
      console.log('   - For Outlook: Verify SMTP access is enabled');
    } else if (result.error.includes('connection')) {
      console.log('\n💡 Connection tips:');
      console.log('   - Check your internet connection');
      console.log('   - Verify EMAIL_HOST and EMAIL_PORT settings');
      console.log('   - Check firewall/antivirus settings');
    }
  }
  
  console.log('\n📖 For detailed setup instructions, see EMAIL_SETUP.md');
  process.exit(result.success ? 0 : 1);
}

// Handle script execution
if (require.main === module) {
  runEmailTest().catch(error => {
    console.error('❌ Unexpected error during email test:', error.message);
    process.exit(1);
  });
}