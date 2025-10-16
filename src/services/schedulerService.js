const { db } = require('../db/database');
const { sendExpiryReminderEmail } = require('./emailService');
const { updateTalkgroups } = require('./talkgroupsService');

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

// Initialize talkgroups table on startup
async function initializeTalkgroups() {
  try {
    // Check if talkgroups table has any data
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM talkgroups');
    const result = countStmt.get();
    
    if (result.count === 0) {
      console.log('Talkgroups table is empty. Populating now...');
      const updateResult = await updateTalkgroups();
      
      if (updateResult.success) {
        console.log(`Initial talkgroups population completed. Added ${updateResult.count} records.`);
      } else {
        console.error('Failed to populate talkgroups on startup:', updateResult.error);
      }
    } else {
      console.log(`Talkgroups table already contains ${result.count} records. Skipping initial population.`);
    }
  } catch (error) {
    console.error('Error checking talkgroups table:', error);
  }
}

// Start the scheduler
async function startScheduler() {
  console.log('Starting scheduler...');
  
  // Run immediately on startup
  checkApiKeyExpiry();
  cleanupOldRecords();
  
  // Check if talkgroups table is empty and populate if needed
  await initializeTalkgroups();
  
  // Schedule talkgroups update at 02:00 daily
  scheduleAt2AM();
  
  // Run every 24 hours (86400000 milliseconds)
  setInterval(() => {
    checkApiKeyExpiry();
    cleanupOldRecords();
  }, 24 * 60 * 60 * 1000);
  
  console.log('Scheduler started - checking every 24 hours');
}

// Schedule talkgroups update at 02:00 AM daily
function scheduleAt2AM() {
  const now = new Date();
  const scheduledTime = new Date();
  
  // Set to 02:00 AM
  scheduledTime.setHours(2, 0, 0, 0);
  
  // If 02:00 AM has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  // Calculate milliseconds until 02:00 AM
  const msUntil2AM = scheduledTime.getTime() - now.getTime();
  
  console.log(`Talkgroups update scheduled for ${scheduledTime.toISOString()}`);
  
  // Schedule the first run at 02:00 AM
  setTimeout(() => {
    runTalkgroupsUpdate();
    
    // Then run every 24 hours
    setInterval(() => {
      runTalkgroupsUpdate();
    }, 24 * 60 * 60 * 1000);
  }, msUntil2AM);
}

// Run talkgroups update
async function runTalkgroupsUpdate() {
  console.log('Running scheduled talkgroups update at', new Date().toISOString());
  try {
    const result = await updateTalkgroups();
    if (result.success) {
      console.log(`Talkgroups update completed successfully. Updated ${result.count} records.`);
    } else {
      console.error('Talkgroups update failed:', result.error);
    }
  } catch (error) {
    console.error('Error during scheduled talkgroups update:', error);
  }
}

module.exports = {
  startScheduler,
  checkApiKeyExpiry,
  cleanupOldRecords,
  runTalkgroupsUpdate,
};
