const { db } = require('../db/database');
const { sendExpiryReminderEmail } = require('./emailService');

// Clean up lastheard records older than 7 days
function cleanupOldRecords() {
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
  
  try {
    const deleteStmt = db.prepare(`
      DELETE FROM lastheard 
      WHERE Start < ?
    `);
    
    const result = deleteStmt.run(sevenDaysAgo);
    
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} lastheard records older than 7 days`);
    }
  } catch (error) {
    console.error('Error cleaning up old records:', error);
  }
}

// Check for keys that need expiry reminders or removal
async function checkApiKeyExpiry() {
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Define reminder periods (in seconds)
  const reminderPeriods = [
    { days: 30, seconds: 30 * 24 * 60 * 60 },
    { days: 15, seconds: 15 * 24 * 60 * 60 },
    { days: 5, seconds: 5 * 24 * 60 * 60 }
  ];

  console.log('Checking API key expiry and sending reminders...');

  // Check for keys that need reminders
  for (const period of reminderPeriods) {
    // Find keys that expire in approximately this period
    // We check for keys expiring between (period - 1 day) and (period + 1 day) to ensure we catch them
    const rangeStart = currentTime + period.seconds - (24 * 60 * 60);
    const rangeEnd = currentTime + period.seconds + (24 * 60 * 60);
    
    const keysNeedingReminder = db.prepare(`
      SELECT * FROM api_keys 
      WHERE is_active = 1 
      AND expires_at BETWEEN ? AND ?
    `).all(rangeStart, rangeEnd);

    for (const key of keysNeedingReminder) {
      console.log(`Sending ${period.days}-day expiry reminder to ${key.email}`);
      try {
        await sendExpiryReminderEmail(
          key.email, 
          key.name, 
          key.api_key, 
          period.days,
          key.expires_at
        );
      } catch (error) {
        console.error(`Failed to send reminder to ${key.email}:`, error);
      }
    }
  }

  // Remove expired API keys
  const expiredKeys = db.prepare(`
    SELECT * FROM api_keys 
    WHERE is_active = 1 
    AND expires_at < ?
  `).all(currentTime);

  if (expiredKeys.length > 0) {
    console.log(`Found ${expiredKeys.length} expired API keys to remove`);
    
    // Deactivate expired keys
    const deactivateStmt = db.prepare(`
      UPDATE api_keys 
      SET is_active = 0 
      WHERE expires_at < ? AND is_active = 1
    `);
    
    const result = deactivateStmt.run(currentTime);
    console.log(`Deactivated ${result.changes} expired API keys`);
  }
}

// Start the scheduler
function startScheduler() {
  console.log('Starting API key expiry scheduler...');
  
  // Run immediately on startup
  checkApiKeyExpiry();
  cleanupOldRecords();
  
  // Run every 24 hours (86400000 milliseconds)
  setInterval(() => {
    checkApiKeyExpiry();
    cleanupOldRecords();
  }, 24 * 60 * 60 * 1000);
  
  console.log('Scheduler started - checking every 24 hours');
}

module.exports = {
  startScheduler,
  checkApiKeyExpiry,
  cleanupOldRecords,
};
