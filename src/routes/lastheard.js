const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

/**
 * @swagger
 * components:
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
 */
router.get('/lastheard', (req, res) => {
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
 *       404:
 *         description: Entry not found
 */
router.get('/lastheard/:id', (req, res) => {
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
 */
router.post('/lastheard', (req, res) => {
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
 */
router.get('/lastheard/callsign/:callsign', (req, res) => {
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
