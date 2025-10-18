/**
 * Database Service Layer
 * 
 * This module provides a centralized data access layer for the application.
 * It abstracts database operations and provides a clean API for data retrieval and manipulation.
 * 
 * Benefits:
 * - Separation of concerns (data access vs presentation logic)
 * - Reusable database queries
 * - Easier testing and maintenance
 * - Consistent error handling
 */

const { pool } = require('../db/database');

/**
 * Lastheard Service
 * Handles all database operations related to lastheard entries
 */
class LastheardService {
  /**
   * Get recent lastheard entries with optional filtering
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of entries to return
   * @param {string} options.callsign - Filter by callsign (supports SQL LIKE patterns)
   * @param {number} options.talkgroup - Filter by talkgroup ID
   * @returns {Array} Array of lastheard entries
   */
  static async getEntries({ limit = 50, callsign = null, talkgroup = null }) {
    let query = 'SELECT * FROM lastheard WHERE "DestinationID" != 9';
    const params = [];
    let paramCount = 1;
    
    if (callsign) {
      query += ` AND "SourceCall" LIKE $${paramCount}`;
      params.push(`%${callsign}%`);
      paramCount++;
    }
    
    if (talkgroup) {
      query += ` AND "DestinationID" = $${paramCount}`;
      params.push(parseInt(talkgroup));
      paramCount++;
    }
    
    query += ` ORDER BY "Start" DESC LIMIT $${paramCount}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get grouped lastheard data by talkgroup for a time period
   * @param {Object} options - Query options
   * @param {number} options.startTime - Unix timestamp for start of period
   * @param {number} options.limit - Maximum number of talkgroups to return
   * @param {string} options.continent - Filter by continent
   * @param {string} options.country - Filter by country code
   * @param {number} options.talkgroup - Filter by specific talkgroup ID
   * @returns {Array} Array of grouped talkgroup statistics
   */
  static async getGroupedByTalkgroup({ startTime, limit = 25, continent = null, country = null, talkgroup = null }) {
    let whereClause = 'WHERE "Start" >= $1 AND "DestinationID" != 9';
    const params = [startTime];
    let paramCount = 2;
    
    if (continent && continent !== 'All') {
      whereClause += ` AND "DestinationID" IN (SELECT talkgroup_id FROM talkgroups WHERE continent = $${paramCount})`;
      params.push(continent);
      paramCount++;
      
      if (country) {
        whereClause += ` AND "DestinationID" IN (SELECT talkgroup_id FROM talkgroups WHERE country = $${paramCount})`;
        params.push(country);
        paramCount++;
      }
    }
    
    if (talkgroup) {
      whereClause += ` AND "DestinationID" = $${paramCount}`;
      params.push(parseInt(talkgroup));
      paramCount++;
    }
    
    const query = `
      SELECT 
        "DestinationID" as "destinationId",
        "DestinationName" as "destinationName",
        COUNT(*) as count,
        SUM(duration) as "totalDuration"
      FROM lastheard
      ${whereClause}
      GROUP BY "DestinationID", "DestinationName"
      ORDER BY count DESC
      LIMIT $${paramCount}
    `;
    params.push(limit);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get grouped lastheard data by callsign for a time period
   * @param {Object} options - Query options
   * @param {number} options.startTime - Unix timestamp for start of period
   * @param {number} options.limit - Maximum number of callsigns to return
   * @param {string} options.callsign - Filter by callsign (supports SQL LIKE patterns)
   * @param {string} options.continent - Filter by continent
   * @param {string} options.country - Filter by country code
   * @param {number} options.talkgroup - Filter by specific talkgroup ID
   * @returns {Array} Array of grouped callsign statistics
   */
  static async getGroupedByCallsign({ startTime, limit = 25, callsign = null, continent = null, country = null, talkgroup = null }) {
    let whereClause = 'WHERE "Start" >= $1 AND "DestinationID" != 9';
    const params = [startTime];
    let paramCount = 2;
    
    if (callsign) {
      whereClause += ` AND "SourceCall" LIKE $${paramCount}`;
      params.push(callsign);
      paramCount++;
    }
    
    if (continent && continent !== 'All') {
      whereClause += ` AND "DestinationID" IN (SELECT talkgroup_id FROM talkgroups WHERE continent = $${paramCount})`;
      params.push(continent);
      paramCount++;
      
      if (country) {
        whereClause += ` AND "DestinationID" IN (SELECT talkgroup_id FROM talkgroups WHERE country = $${paramCount})`;
        params.push(country);
        paramCount++;
      }
    }
    
    if (talkgroup) {
      whereClause += ` AND "DestinationID" = $${paramCount}`;
      params.push(parseInt(talkgroup));
      paramCount++;
    }
    
    const query = `
      SELECT 
        "SourceCall" as callsign,
        MAX("SourceName") as name,
        COUNT(*) as count,
        SUM(duration) as "totalDuration"
      FROM lastheard
      ${whereClause}
      GROUP BY "SourceCall"
      ORDER BY count DESC
      LIMIT $${paramCount}
    `;
    params.push(limit);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get statistics about lastheard data
   * @returns {Object} Statistics object with counts
   */
  static async getStatistics() {
    const totalEntries = await pool.query('SELECT COUNT(*) as count FROM lastheard WHERE "DestinationID" != 9');
    const last24Hours = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const recentEntries = await pool.query('SELECT COUNT(*) as count FROM lastheard WHERE "Start" > $1 AND "DestinationID" != 9', [last24Hours]);
    const uniqueCallsigns = await pool.query('SELECT COUNT(DISTINCT "SourceCall") as count FROM lastheard WHERE "DestinationID" != 9');
    const uniqueTalkgroups = await pool.query('SELECT COUNT(DISTINCT "DestinationID") as count FROM lastheard WHERE "DestinationID" != 9');
    
    return {
      totalEntries: parseInt(totalEntries.rows[0].count),
      last24Hours: parseInt(recentEntries.rows[0].count),
      uniqueCallsigns: parseInt(uniqueCallsigns.rows[0].count),
      uniqueTalkgroups: parseInt(uniqueTalkgroups.rows[0].count)
    };
  }
}

/**
 * Talkgroup Service
 * Handles all database operations related to talkgroups
 */
class TalkgroupService {
  /**
   * Get all unique continents
   * @returns {Array} Array of continent names
   */
  static async getContinents() {
    const result = await pool.query('SELECT DISTINCT continent FROM talkgroups WHERE continent IS NOT NULL ORDER BY continent');
    return result.rows.map(row => row.continent);
  }

  /**
   * Get countries for a specific continent
   * @param {string} continent - Continent name
   * @returns {Array} Array of country objects with code and name
   */
  static async getCountriesByContinent(continent) {
    if (!continent || continent === 'All' || continent === 'Global') {
      return [];
    }
    
    const result = await pool.query('SELECT DISTINCT country, full_country_name FROM talkgroups WHERE continent = $1 ORDER BY country', [continent]);
    return result.rows.map(row => ({
      label: row.full_country_name || row.country,
      value: row.country
    }));
  }

  /**
   * Get talkgroups for a specific continent and country
   * @param {Object} options - Query options
   * @param {string} options.continent - Continent name
   * @param {string} options.country - Country code (optional)
   * @returns {Array} Array of talkgroup objects
   */
  static async getTalkgroups({ continent, country = null }) {
    if (!continent || continent === 'All' || continent === 'Global') {
      return [];
    }
    
    let query = 'SELECT talkgroup_id, name FROM talkgroups WHERE continent = $1';
    const params = [continent];
    
    if (country) {
      query += ' AND country = $2';
      params.push(country);
    }
    
    query += ' ORDER BY talkgroup_id';
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = {
  LastheardService,
  TalkgroupService
};
