const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

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
 *           enum: [5m, 15m, 30m, 1h, 2h, 6h, 12h, 24h]
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
router.get('/lastheard/grouped', (req, res) => {
  try {
    const timeRange = req.query.timeRange || '5m';
    const continent = req.query.continent;
    const country = req.query.country;
    const limit = Math.min(parseInt(req.query.limit) || 25, 50);
    
    // Calculate start time based on time range
    const now = Math.floor(Date.now() / 1000);
    let startTime;
    
    switch (timeRange) {
      case '5m': startTime = now - (5 * 60); break;
      case '15m': startTime = now - (15 * 60); break;
      case '30m': startTime = now - (30 * 60); break;
      case '1h': startTime = now - (60 * 60); break;
      case '2h': startTime = now - (2 * 60 * 60); break;
      case '6h': startTime = now - (6 * 60 * 60); break;
      case '12h': startTime = now - (12 * 60 * 60); break;
      case '24h': startTime = now - (24 * 60 * 60); break;
      default: startTime = now - (5 * 60);
    }
    
    // Build query for filtering by continent/country via talkgroups table
    let whereClause = 'WHERE Start >= ? AND DestinationID != 9';
    const params = [startTime];
    
    if (continent && continent !== 'All') {
      whereClause += ' AND DestinationID IN (SELECT talkgroup_id FROM talkgroups WHERE continent = ?)';
      params.push(continent);
      
      if (country) {
        whereClause += ' AND DestinationID IN (SELECT talkgroup_id FROM talkgroups WHERE country = ?)';
        params.push(country);
      }
    }
    // When continent is 'All' or not specified, show all talkgroups
    
    // Group by talkgroup and get count and total duration
    const query = `
      SELECT 
        DestinationID as destinationId,
        DestinationName as destinationName,
        COUNT(*) as count,
        SUM(duration) as totalDuration
      FROM lastheard
      ${whereClause}
      GROUP BY DestinationID, DestinationName
      ORDER BY count DESC
      LIMIT ?
    `;
    params.push(limit);
    
    const stmt = db.prepare(query);
    const entries = stmt.all(...params);
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
router.get('/lastheard', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const callsign = req.query.callsign;
    const talkgroup = req.query.talkgroup;
    
    let query = 'SELECT * FROM lastheard WHERE DestinationID != 9';
    const params = [];
    
    if (callsign) {
      query += ' AND SourceCall LIKE ?';
      params.push(`%${callsign}%`);
    }
    
    if (talkgroup) {
      query += ' AND DestinationID = ?';
      params.push(parseInt(talkgroup));
    }
    
    query += ' ORDER BY Start DESC LIMIT ?';
    params.push(limit);
    
    const stmt = db.prepare(query);
    const entries = stmt.all(...params);
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
router.get('/stats', (req, res) => {
  try {
    const totalEntries = db.prepare('SELECT COUNT(*) as count FROM lastheard WHERE DestinationID != 9').get();
    const recentEntries = db.prepare('SELECT COUNT(*) as count FROM lastheard WHERE Start > ? AND DestinationID != 9').get(
      Math.floor(Date.now() / 1000) - 24 * 60 * 60 // last 24 hours
    );
    const uniqueCallsigns = db.prepare('SELECT COUNT(DISTINCT SourceCall) as count FROM lastheard WHERE DestinationID != 9').get();
    const uniqueTalkgroups = db.prepare('SELECT COUNT(DISTINCT DestinationID) as count FROM lastheard WHERE DestinationID != 9').get();
    
    res.json({
      totalEntries: totalEntries.count,
      last24Hours: recentEntries.count,
      uniqueCallsigns: uniqueCallsigns.count,
      uniqueTalkgroups: uniqueTalkgroups.count
    });
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
router.get('/continents', (req, res) => {
  try {
    const stmt = db.prepare('SELECT DISTINCT continent FROM talkgroups WHERE continent IS NOT NULL ORDER BY continent');
    const continents = stmt.all().map(row => row.continent);
    // Return all continents (including Global) - the frontend will add "All" option
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
router.get('/countries', (req, res) => {
  try {
    const continent = req.query.continent;
    if (!continent || continent === 'All' || continent === 'Global') {
      return res.json([]);
    }
    
    const stmt = db.prepare('SELECT DISTINCT country, full_country_name FROM talkgroups WHERE continent = ? ORDER BY country');
    const countries = stmt.all(continent).map(row => ({
      label: row.full_country_name || row.country,
      value: row.country
    }));
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
