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
 *         callsign:
 *           type: string
 *           description: Amateur radio callsign
 *         dmr_id:
 *           type: integer
 *           description: DMR ID
 *         timestamp:
 *           type: integer
 *           description: Unix timestamp
 *         talkgroup:
 *           type: integer
 *           description: Talkgroup number
 *         timeslot:
 *           type: integer
 *           description: Timeslot (1 or 2)
 *         duration:
 *           type: integer
 *           description: Duration in seconds
 *         reflector:
 *           type: string
 *           description: Reflector name
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
    const stmt = db.prepare('SELECT * FROM lastheard ORDER BY timestamp DESC LIMIT ?');
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
 *               - callsign
 *               - dmr_id
 *               - timestamp
 *               - talkgroup
 *               - timeslot
 *             properties:
 *               callsign:
 *                 type: string
 *               dmr_id:
 *                 type: integer
 *               timestamp:
 *                 type: integer
 *               talkgroup:
 *                 type: integer
 *               timeslot:
 *                 type: integer
 *               duration:
 *                 type: integer
 *               reflector:
 *                 type: string
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
    const { callsign, dmr_id, timestamp, talkgroup, timeslot, duration, reflector } = req.body;
    
    if (!callsign || !dmr_id || !timestamp || !talkgroup || !timeslot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO lastheard (callsign, dmr_id, timestamp, talkgroup, timeslot, duration, reflector)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(callsign, dmr_id, timestamp, talkgroup, timeslot, duration || null, reflector || null);
    
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
    const stmt = db.prepare('SELECT * FROM lastheard WHERE callsign = ? ORDER BY timestamp DESC LIMIT ?');
    const entries = stmt.all(req.params.callsign, limit);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
