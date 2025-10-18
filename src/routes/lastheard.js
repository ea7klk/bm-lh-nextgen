/**
 * Lastheard Routes
 * 
 * This file previously contained authenticated API endpoints for lastheard data.
 * These endpoints have been removed as they were not being used anywhere in the application.
 * All lastheard data is now accessed through public endpoints in public.js which don't require authentication.
 * 
 * Removed endpoints:
 * - GET /api/lastheard - Not used in frontend (replaced by public endpoint)
 * - GET /api/lastheard/:id - Not used anywhere
 * - POST /api/lastheard - Not used anywhere (data comes from Brandmeister websocket)
 * - GET /api/lastheard/callsign/:callsign - Not used anywhere (replaced by public endpoint with better filtering)
 * 
 * Note: The API key authentication system is still in place and functional for future use if needed.
 */

const express = require('express');
const router = express.Router();

// This router is currently empty as all lastheard endpoints have been moved to public.js
// or removed due to lack of usage. Keep this file for future authenticated lastheard endpoints.

module.exports = router;
