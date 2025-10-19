const express = require('express');
const router = express.Router();
const { LastheardService, TalkgroupService } = require('../services/databaseService');

/**
 * @swagger
 * /public/lastheard/grouped:
 *   get:
 *     summary: Get grouped lastheard data by talkgroup (public, no authentication)
 *     description: Retrieve aggregated lastheard data grouped by talkgroup for a time period
 *     tags:
 *       - Public
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [5m, 15m, 30m, 1h, 2h, 6h, 12h, 24h, 2d, 5d, 1w, 2w, 1M]
 *           default: 5m
 *         description: Time range for data aggregation
 *       - in: query
 *         name: continent
 *         schema:
 *           type: string
 *         description: Filter by continent name
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country code (2-letter)
 *       - in: query
 *         name: talkgroup
 *         schema:
 *           type: integer
 *         description: Filter by talkgroup ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Number of talkgroups to return (max 50)
 *     responses:
 *       200:
 *         description: Grouped lastheard data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
/**
 * Get grouped lastheard data by talkgroup
 * Groups lastheard entries by talkgroup and returns aggregated statistics
 */
router.get('/lastheard/grouped', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '5m';
    const continent = req.query.continent;
    const country = req.query.country;
    const talkgroup = req.query.talkgroup;
    const limit = Math.min(parseInt(req.query.limit) || 25, 50);
    
    // Calculate start time based on time range
    const now = Math.floor(Date.now() / 1000);
    const timeMap = {
      '5m': 5 * 60,
      '15m': 15 * 60,
      '30m': 30 * 60,
      '1h': 60 * 60,
      '2h': 2 * 60 * 60,
      '6h': 6 * 60 * 60,
      '12h': 12 * 60 * 60,
      '24h': 24 * 60 * 60,
      '2d': 2 * 24 * 60 * 60,
      '5d': 5 * 24 * 60 * 60,
      '1w': 7 * 24 * 60 * 60,
      '2w': 14 * 24 * 60 * 60,
      '1M': 30 * 24 * 60 * 60
    };
    const startTime = now - (timeMap[timeRange] || timeMap['5m']);
    
    // Use database service to get grouped data
    const entries = await LastheardService.getGroupedByTalkgroup({
      startTime,
      limit,
      continent,
      country,
      talkgroup: talkgroup ? parseInt(talkgroup) : null
    });
    
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /public/lastheard:
 *   get:
 *     summary: Get recent lastheard entries (public, no authentication)
 *     description: Retrieve the most recent lastheard entries for public viewing
 *     tags:
 *       - Public
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of entries to return (max 100)
 *       - in: query
 *         name: callsign
 *         schema:
 *           type: string
 *         description: Filter by callsign
 *       - in: query
 *         name: talkgroup
 *         schema:
 *           type: integer
 *         description: Filter by talkgroup ID
 *     responses:
 *       200:
 *         description: List of lastheard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
/**
 * Get recent lastheard entries with optional filtering
 * Public endpoint - no authentication required
 */
router.get('/lastheard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const callsign = req.query.callsign;
    const talkgroup = req.query.talkgroup;
    
    // Use database service to get entries
    const entries = await LastheardService.getEntries({
      limit,
      callsign,
      talkgroup: talkgroup ? parseInt(talkgroup) : null
    });
    
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /public/stats:
 *   get:
 *     summary: Get statistics (public, no authentication)
 *     description: Get basic statistics about the lastheard data
 *     tags:
 *       - Public
 *     responses:
 *       200:
 *         description: Statistics object
 */
/**
 * Get statistics about lastheard data
 * Returns aggregated statistics for display
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await LastheardService.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /public/continents:
 *   get:
 *     summary: Get list of continents (public, no authentication)
 *     description: Get unique continents from talkgroups
 *     tags:
 *       - Public
 *     responses:
 *       200:
 *         description: List of continent names
 */
/**
 * Get list of unique continents from talkgroups
 * Used for filtering in the frontend
 */
router.get('/continents', async (req, res) => {
  try {
    const continents = await TalkgroupService.getContinents();
    res.json(continents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /public/countries:
 *   get:
 *     summary: Get list of countries for a continent (public, no authentication)
 *     description: Get unique countries for a specific continent
 *     tags:
 *       - Public
 *     parameters:
 *       - in: query
 *         name: continent
 *         required: true
 *         schema:
 *           type: string
 *         description: Continent name
 *     responses:
 *       200:
 *         description: List of countries
 */
/**
 * Get list of countries for a specific continent
 * Used for filtering in the frontend
 */
router.get('/countries', async (req, res) => {
  try {
    const continent = req.query.continent;
    const countries = await TalkgroupService.getCountriesByContinent(continent);
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /public/talkgroups:
 *   get:
 *     summary: Get list of talkgroups (public, no authentication)
 *     description: Get list of talkgroups for a specific continent and country
 *     tags:
 *       - Public
 *     parameters:
 *       - in: query
 *         name: continent
 *         required: true
 *         schema:
 *           type: string
 *         description: Continent name
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country code
 *     responses:
 *       200:
 *         description: List of talkgroups
 */
/**
 * Get list of talkgroups for a specific continent and country
 * Used for filtering in the advanced functions page
 */
router.get('/talkgroups', async (req, res) => {
  try {
    const continent = req.query.continent;
    const country = req.query.country;
    
    const talkgroups = await TalkgroupService.getTalkgroups({ continent, country });
    res.json(talkgroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /public/lastheard/callsigns:
 *   get:
 *     summary: Get grouped lastheard data by callsign (public, no authentication)
 *     description: Retrieve aggregated lastheard data grouped by callsign for a time period
 *     tags:
 *       - Public
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [5m, 15m, 30m, 1h, 2h, 6h, 12h, 24h, 2d, 5d, 1w, 2w, 1M]
 *           default: 5m
 *         description: Time range for data aggregation
 *       - in: query
 *         name: callsign
 *         schema:
 *           type: string
 *         description: Filter by callsign (supports SQL LIKE patterns with %)
 *       - in: query
 *         name: continent
 *         schema:
 *           type: string
 *         description: Filter by continent name
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country code (2-letter)
 *       - in: query
 *         name: talkgroup
 *         schema:
 *           type: integer
 *         description: Filter by talkgroup ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Number of callsigns to return (max 50)
 *     responses:
 *       200:
 *         description: Grouped lastheard data by callsign
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
/**
 * Get grouped lastheard data by callsign
 * Groups lastheard entries by callsign and returns aggregated statistics
 */
router.get('/lastheard/callsigns', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '5m';
    const callsignFilter = req.query.callsign;
    const continent = req.query.continent;
    const country = req.query.country;
    const talkgroup = req.query.talkgroup;
    const limit = Math.min(parseInt(req.query.limit) || 25, 50);
    
    // Calculate start time based on time range
    const now = Math.floor(Date.now() / 1000);
    const timeMap = {
      '5m': 5 * 60,
      '15m': 15 * 60,
      '30m': 30 * 60,
      '1h': 60 * 60,
      '2h': 2 * 60 * 60,
      '6h': 6 * 60 * 60,
      '12h': 12 * 60 * 60,
      '24h': 24 * 60 * 60,
      '2d': 2 * 24 * 60 * 60,
      '5d': 5 * 24 * 60 * 60,
      '1w': 7 * 24 * 60 * 60,
      '2w': 14 * 24 * 60 * 60,
      '1M': 30 * 24 * 60 * 60
    };
    const startTime = now - (timeMap[timeRange] || timeMap['5m']);
    
    // Use database service to get grouped data
    const entries = await LastheardService.getGroupedByCallsign({
      startTime,
      limit,
      callsign: callsignFilter,
      continent,
      country,
      talkgroup: talkgroup ? parseInt(talkgroup) : null
    });
    
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
