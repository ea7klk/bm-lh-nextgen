const { io } = require('socket.io-client');
const { pool } = require('../db/database');

let socket = null;
let successfulInsertions = 0;

// Helper to check if a value is a non-empty string
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';

// Start the Brandmeister websocket connection
function startBrandmeisterService() {
  console.log('Starting Brandmeister Lastheard websocket service...');
  
  socket = io('https://api.brandmeister.network', {
    path: '/lh/socket.io',
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('Connected to Brandmeister Lastheard websocket');
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from Brandmeister websocket:', reason);
  });

  socket.on('error', (error) => {
    console.error('Brandmeister websocket error:', error);
  });

  socket.on('mqtt', async (data) => {
    try {
      const msg = JSON.parse(data.payload);

      const isSessionStop = msg.Event === 'Session-Stop';
      const hasGroupVoiceCall =
        Array.isArray(msg.CallTypes) &&
        ['Group', 'Voice', 'Call'].every((t) => msg.CallTypes.includes(t));

      const sourceOk = isNonEmptyString(msg.SourceCall);
      const destOk = isNonEmptyString(msg.DestinationName);

      const start = Number(msg.Start);
      const stop = Number(msg.Stop);
      const duration = Number.isFinite(start) && Number.isFinite(stop) ? stop - start : NaN;
      const destinationId = Number(msg.DestinationID);

      // Exclude Local talkgroup (ID 9) from all processing
      if (isSessionStop && hasGroupVoiceCall && sourceOk && destOk && duration > 5 && destinationId !== 9) {
        // Insert into database
        try {
          await pool.query(`
            INSERT INTO lastheard (
              "SourceID", "DestinationID", "SourceCall", "SourceName", 
              "DestinationCall", "DestinationName", "Start", "Stop", 
              "TalkerAlias", duration
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            msg.SourceID || null,
            msg.DestinationID || null,
            msg.SourceCall.trim(),
            msg.SourceName || null,
            msg.DestinationCall || null,
            msg.DestinationName.trim(),
            start,
            stop,
            msg.TalkerAlias || null,
            duration
          ]);

          // Count successful insertions and log every 100
          successfulInsertions++;
          if (successfulInsertions % 100 === 0) {
            console.log(`[${new Date().toISOString()}] Successfully inserted ${successfulInsertions} records`);
          }
        } catch (dbError) {
          console.error('Database insert error:', dbError.message);
        }
      }
    } catch (parseError) {
      // Silently skip malformed payloads
    }
  });

  console.log('Brandmeister websocket service started');
}

// Stop the websocket connection (for cleanup)
function stopBrandmeisterService() {
  if (socket) {
    console.log('Stopping Brandmeister websocket service...');
    if (successfulInsertions > 0) {
      console.log(`[${new Date().toISOString()}] Service stopped. Total successful insertions: ${successfulInsertions}`);
    }
    socket.disconnect();
    socket = null;
    successfulInsertions = 0; // Reset counter
  }
}

module.exports = {
  startBrandmeisterService,
  stopBrandmeisterService,
};
