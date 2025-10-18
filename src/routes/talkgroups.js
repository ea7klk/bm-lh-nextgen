/**
 * Talkgroups Routes
 * 
 * This file previously contained authenticated API endpoints for talkgroup data.
 * These endpoints have been removed as they were not being used anywhere in the application.
 * All talkgroup data is now accessed through public endpoints in public.js which don't require authentication.
 * 
 * Removed endpoints:
 * - GET /api/talkgroups/continents - Not used in frontend (duplicates public endpoint)
 * - GET /api/talkgroups/countries - Not used anywhere (duplicates public endpoint)
 * - GET /api/talkgroups/countries/:continent - Not used anywhere (duplicates public endpoint)
 * - GET /api/talkgroups - Not used anywhere
 * - GET /api/talkgroups/continent/:continent - Not used anywhere
 * - GET /api/talkgroups/country/:country - Not used anywhere
 * 
 * All talkgroup functionality is available through:
 * - GET /public/continents
 * - GET /public/countries?continent=:continent
 * - GET /public/talkgroups?continent=:continent&country=:country
 */

const express = require('express');
const router = express.Router();

// This router is currently empty as all talkgroup endpoints have been moved to public.js
// or removed due to lack of usage. Keep this file for future authenticated talkgroup endpoints.

module.exports = router;
