const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Talkgroup:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Database ID
 *         talkgroup_id:
 *           type: integer
 *           description: Talkgroup ID
 *         name:
 *           type: string
 *           description: Talkgroup name
 *         country:
 *           type: string
 *           description: Country code
 *         continent:
 *           type: string
 *           description: Continent name
 *         full_country_name:
 *           type: string
 *           description: Full country name
 *         last_updated:
 *           type: integer
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/talkgroups/continents:
 *   get:
 *     summary: List all continents
 *     description: Get a list of all unique continents in the talkgroups table
 *     tags:
 *       - Talkgroups
 *     responses:
 *       200:
 *         description: List of continents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/talkgroups/continents', (req, res) => {
  try {
    const stmt = db.prepare('SELECT DISTINCT continent FROM talkgroups WHERE continent IS NOT NULL ORDER BY continent');
    const continents = stmt.all().map(row => row.continent);
    res.json(continents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/talkgroups/countries:
 *   get:
 *     summary: List all countries
 *     description: Get a list of all unique countries in the talkgroups table
 *     tags:
 *       - Talkgroups
 *     responses:
 *       200:
 *         description: List of countries with their full names
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                     description: Country code
 *                   full_country_name:
 *                     type: string
 *                     description: Full country name
 */
router.get('/talkgroups/countries', (req, res) => {
  try {
    const stmt = db.prepare('SELECT DISTINCT country, full_country_name FROM talkgroups ORDER BY country');
    const countries = stmt.all();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/talkgroups/countries/{continent}:
 *   get:
 *     summary: List countries by continent
 *     description: Get a list of countries for a specific continent
 *     tags:
 *       - Talkgroups
 *     parameters:
 *       - in: path
 *         name: continent
 *         required: true
 *         schema:
 *           type: string
 *         description: Continent name
 *     responses:
 *       200:
 *         description: List of countries in the continent
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                     description: Country code
 *                   full_country_name:
 *                     type: string
 *                     description: Full country name
 */
router.get('/talkgroups/countries/:continent', (req, res) => {
  try {
    const stmt = db.prepare('SELECT DISTINCT country, full_country_name FROM talkgroups WHERE continent = ? ORDER BY country');
    const countries = stmt.all(req.params.continent);
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/talkgroups:
 *   get:
 *     summary: List all talkgroups
 *     description: Get a list of all talkgroups
 *     tags:
 *       - Talkgroups
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of talkgroups to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of talkgroups to skip
 *     responses:
 *       200:
 *         description: List of talkgroups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Talkgroup'
 */
router.get('/talkgroups', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const stmt = db.prepare('SELECT * FROM talkgroups ORDER BY talkgroup_id LIMIT ? OFFSET ?');
    const talkgroups = stmt.all(limit, offset);
    res.json(talkgroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/talkgroups/continent/{continent}:
 *   get:
 *     summary: List all talkgroups by continent
 *     description: Get all talkgroups for a specific continent
 *     tags:
 *       - Talkgroups
 *     parameters:
 *       - in: path
 *         name: continent
 *         required: true
 *         schema:
 *           type: string
 *         description: Continent name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of talkgroups to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of talkgroups to skip
 *     responses:
 *       200:
 *         description: List of talkgroups for the continent
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Talkgroup'
 */
router.get('/talkgroups/continent/:continent', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const stmt = db.prepare('SELECT * FROM talkgroups WHERE continent = ? ORDER BY talkgroup_id LIMIT ? OFFSET ?');
    const talkgroups = stmt.all(req.params.continent, limit, offset);
    res.json(talkgroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/talkgroups/country/{country}:
 *   get:
 *     summary: List all talkgroups by country
 *     description: Get all talkgroups for a specific country
 *     tags:
 *       - Talkgroups
 *     parameters:
 *       - in: path
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *         description: Country code
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of talkgroups to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of talkgroups to skip
 *     responses:
 *       200:
 *         description: List of talkgroups for the country
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Talkgroup'
 */
router.get('/talkgroups/country/:country', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const stmt = db.prepare('SELECT * FROM talkgroups WHERE country = ? ORDER BY talkgroup_id LIMIT ? OFFSET ?');
    const talkgroups = stmt.all(req.params.country, limit, offset);
    res.json(talkgroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
