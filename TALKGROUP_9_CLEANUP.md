# Database Cleanup Script for Talkgroup 9 (Local)

This script removes existing data for talkgroup ID 9 "Local" from the database to implement the filtering requirement.

## SQL Commands to Run

```sql
-- Remove all lastheard entries for talkgroup 9
DELETE FROM lastheard WHERE DestinationID = 9;

-- Remove talkgroup 9 from talkgroups table  
DELETE FROM talkgroups WHERE talkgroup_id = 9;

-- Verify cleanup
SELECT COUNT(*) as remaining_lastheard_local FROM lastheard WHERE DestinationID = 9;
SELECT COUNT(*) as remaining_talkgroup_local FROM talkgroups WHERE talkgroup_id = 9;
```

## Manual Cleanup Instructions

1. **Connect to the database:**
   ```bash
   sqlite3 data/lastheard.db
   ```

2. **Run the cleanup commands:**
   ```sql
   DELETE FROM lastheard WHERE DestinationID = 9;
   DELETE FROM talkgroups WHERE talkgroup_id = 9;
   ```

3. **Verify the cleanup:**
   ```sql
   SELECT COUNT(*) FROM lastheard WHERE DestinationID = 9;
   SELECT COUNT(*) FROM talkgroups WHERE talkgroup_id = 9;
   ```
   Both should return 0.

4. **Exit SQLite:**
   ```sql
   .quit
   ```

## Automatic Cleanup (Node.js)

You can also run this cleanup automatically by adding this to your server startup:

```javascript
// In src/db/database.js or a separate cleanup script
function cleanupLocalTalkgroup() {
  try {
    console.log('Cleaning up Local talkgroup (ID 9) records...');
    
    const deleteLastheard = db.prepare('DELETE FROM lastheard WHERE DestinationID = 9');
    const deleteTalkgroup = db.prepare('DELETE FROM talkgroups WHERE talkgroup_id = 9');
    
    const lastheardDeleted = deleteLastheard.run();
    const talkgroupDeleted = deleteTalkgroup.run();
    
    console.log(`Deleted ${lastheardDeleted.changes} lastheard records for Local talkgroup`);
    console.log(`Deleted ${talkgroupDeleted.changes} talkgroup records for Local talkgroup`);
    
    return true;
  } catch (error) {
    console.error('Error cleaning up Local talkgroup:', error);
    return false;
  }
}

// Call during database initialization
cleanupLocalTalkgroup();
```

This cleanup ensures that any existing Local talkgroup data is removed from the database to match the new filtering behavior.