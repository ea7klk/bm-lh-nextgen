const { db } = require('../db/database');
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

// Clean up expired password reset tokens and email change tokens
function cleanupExpiredTokens() {
  const currentTime = Math.floor(Date.now() / 1000);
  
  try {
    // Delete expired password reset tokens
    const deleteResetTokensStmt = db.prepare(`
      DELETE FROM password_reset_tokens 
      WHERE expires_at < ?
    `);
    const resetResult = deleteResetTokensStmt.run(currentTime);
    
    if (resetResult.changes > 0) {
      console.log(`Cleaned up ${resetResult.changes} expired password reset tokens`);
    }

    // Delete expired email change tokens
    const deleteEmailTokensStmt = db.prepare(`
      DELETE FROM email_change_tokens 
      WHERE expires_at < ?
    `);
    const emailResult = deleteEmailTokensStmt.run(currentTime);
    
    if (emailResult.changes > 0) {
      console.log(`Cleaned up ${emailResult.changes} expired email change tokens`);
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
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
  cleanupOldRecords();
  cleanupExpiredTokens();
  
  // Check if talkgroups table is empty and populate if needed
  await initializeTalkgroups();
  
  // Schedule talkgroups update at 02:00 daily
  scheduleAt2AM();
  
  // Run every 24 hours (86400000 milliseconds)
  setInterval(() => {
    cleanupOldRecords();
    cleanupExpiredTokens();
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
  cleanupOldRecords,
  cleanupExpiredTokens,
  runTalkgroupsUpdate,
  initializeTalkgroups,
};
