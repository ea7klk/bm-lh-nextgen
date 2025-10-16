const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateApiKey } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: X-API-Key
 *   schemas:
 *     LastheardEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         SourceID:
 *           type: integer
 *           description: Source DMR ID
 *         DestinationID:
 *           type: integer
 *           description: Destination ID (talkgroup)
 *         SourceCall:
 *           type: string
 *           description: Source callsign
 *         SourceName:
 *           type: string
 *           description: Source name
 *         DestinationCall:
 *           type: string
 *           description: Destination callsign
 *         DestinationName:
 *           type: string
 *           description: Destination name
 *         Start:
 *           type: integer
 *           description: Start timestamp (Unix)
 *         Stop:
 *           type: integer
 *           description: Stop timestamp (Unix)
 *         TalkerAlias:
 *           type: string
 *           description: Talker alias
 *         duration:
 *           type: integer
 *           description: Duration in seconds
 *         created_at:
 *           type: integer
 *           description: Record creation timestamp
 */

/**
 * @swagger
 * /api/lastheard:
 *   get:
 *     summary: Get recent lastheard entries
 *     description: Retrieve the most recent lastheard entries
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of entries to return
 *     responses:
 *       200:
 *         description: List of lastheard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LastheardEntry'
 *       401:
 *         description: API key is required
 *       403:
 *         description: Invalid or inactive API key
 */
router.get('/lastheard', authenticateApiKey, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const stmt = db.prepare('SELECT * FROM lastheard ORDER BY Start DESC LIMIT ?');
    const entries = stmt.all(limit);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/lastheard/{id}:
 *   get:
 *     summary: Get a specific lastheard entry
 *     description: Retrieve a single lastheard entry by ID
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Entry ID
 *     responses:
 *       200:
 *         description: Lastheard entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LastheardEntry'
 *       401:
 *         description: API key is required
 *       403:
 *         description: Invalid or inactive API key
 *       404:
 *         description: Entry not found
 */
router.get('/lastheard/:id', authenticateApiKey, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM lastheard WHERE id = ?');
    const entry = stmt.get(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/lastheard:
 *   post:
 *     summary: Create a new lastheard entry
 *     description: Add a new lastheard entry to the database
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - SourceID
 *               - DestinationID
 *               - SourceCall
 *               - Start
 *             properties:
 *               SourceID:
 *                 type: integer
 *               DestinationID:
 *                 type: integer
 *               SourceCall:
 *                 type: string
 *               SourceName:
 *                 type: string
 *               DestinationCall:
 *                 type: string
 *               DestinationName:
 *                 type: string
 *               Start:
 *                 type: integer
 *               Stop:
 *                 type: integer
 *               TalkerAlias:
 *                 type: string
 *               duration:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LastheardEntry'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: API key is required
 *       403:
 *         description: Invalid or inactive API key
 */
router.post('/lastheard', authenticateApiKey, (req, res) => {
  try {
    const { SourceID, DestinationID, SourceCall, SourceName, DestinationCall, DestinationName, Start, Stop, TalkerAlias, duration } = req.body;
    
    if (!SourceID || !DestinationID || !SourceCall || !Start) {
      return res.status(400).json({ error: 'Missing required fields: SourceID, DestinationID, SourceCall, Start' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO lastheard (SourceID, DestinationID, SourceCall, SourceName, DestinationCall, DestinationName, Start, Stop, TalkerAlias, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(SourceID, DestinationID, SourceCall, SourceName || null, DestinationCall || null, DestinationName || null, Start, Stop || null, TalkerAlias || null, duration || null);
    
    const newEntry = db.prepare('SELECT * FROM lastheard WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/lastheard/callsign/{callsign}:
 *   get:
 *     summary: Get lastheard entries by callsign
 *     description: Retrieve lastheard entries for a specific callsign
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: callsign
 *         required: true
 *         schema:
 *           type: string
 *         description: Amateur radio callsign
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of entries to return
 *     responses:
 *       200:
 *         description: List of lastheard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LastheardEntry'
 *       401:
 *         description: API key is required
 *       403:
 *         description: Invalid or inactive API key
 */
router.get('/lastheard/callsign/:callsign', authenticateApiKey, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const stmt = db.prepare('SELECT * FROM lastheard WHERE SourceCall = ? ORDER BY Start DESC LIMIT ?');
    const entries = stmt.all(req.params.callsign, limit);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
