const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

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
    
    let query = 'SELECT * FROM lastheard WHERE 1=1';
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
    const totalEntries = db.prepare('SELECT COUNT(*) as count FROM lastheard').get();
    const recentEntries = db.prepare('SELECT COUNT(*) as count FROM lastheard WHERE Start > ?').get(
      Math.floor(Date.now() / 1000) - 24 * 60 * 60 // last 24 hours
    );
    const uniqueCallsigns = db.prepare('SELECT COUNT(DISTINCT SourceCall) as count FROM lastheard').get();
    const uniqueTalkgroups = db.prepare('SELECT COUNT(DISTINCT DestinationID) as count FROM lastheard').get();
    
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

module.exports = router;
