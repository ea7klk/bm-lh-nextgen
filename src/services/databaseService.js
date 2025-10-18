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

const { db } = require('../db/database');

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
  static getEntries({ limit = 50, callsign = null, talkgroup = null }) {
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
    return stmt.all(...params);
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
  static getGroupedByTalkgroup({ startTime, limit = 25, continent = null, country = null, talkgroup = null }) {
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
    
    if (talkgroup) {
      whereClause += ' AND DestinationID = ?';
      params.push(parseInt(talkgroup));
    }
    
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
    return stmt.all(...params);
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
  static getGroupedByCallsign({ startTime, limit = 25, callsign = null, continent = null, country = null, talkgroup = null }) {
    let whereClause = 'WHERE Start >= ? AND DestinationID != 9';
    const params = [startTime];
    
    if (callsign) {
      whereClause += ' AND SourceCall LIKE ?';
      params.push(callsign);
    }
    
    if (continent && continent !== 'All') {
      whereClause += ' AND DestinationID IN (SELECT talkgroup_id FROM talkgroups WHERE continent = ?)';
      params.push(continent);
      
      if (country) {
        whereClause += ' AND DestinationID IN (SELECT talkgroup_id FROM talkgroups WHERE country = ?)';
        params.push(country);
      }
    }
    
    if (talkgroup) {
      whereClause += ' AND DestinationID = ?';
      params.push(parseInt(talkgroup));
    }
    
    const query = `
      SELECT 
        SourceCall as callsign,
        MAX(SourceName) as name,
        COUNT(*) as count,
        SUM(duration) as totalDuration
      FROM lastheard
      ${whereClause}
      GROUP BY SourceCall
      ORDER BY count DESC
      LIMIT ?
    `;
    params.push(limit);
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get statistics about lastheard data
   * @returns {Object} Statistics object with counts
   */
  static getStatistics() {
    const totalEntries = db.prepare('SELECT COUNT(*) as count FROM lastheard WHERE DestinationID != 9').get();
    const last24Hours = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    const recentEntries = db.prepare('SELECT COUNT(*) as count FROM lastheard WHERE Start > ? AND DestinationID != 9').get(last24Hours);
    const uniqueCallsigns = db.prepare('SELECT COUNT(DISTINCT SourceCall) as count FROM lastheard WHERE DestinationID != 9').get();
    const uniqueTalkgroups = db.prepare('SELECT COUNT(DISTINCT DestinationID) as count FROM lastheard WHERE DestinationID != 9').get();
    
    return {
      totalEntries: totalEntries.count,
      last24Hours: recentEntries.count,
      uniqueCallsigns: uniqueCallsigns.count,
      uniqueTalkgroups: uniqueTalkgroups.count
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
  static getContinents() {
    const stmt = db.prepare('SELECT DISTINCT continent FROM talkgroups WHERE continent IS NOT NULL ORDER BY continent');
    return stmt.all().map(row => row.continent);
  }

  /**
   * Get countries for a specific continent
   * @param {string} continent - Continent name
   * @returns {Array} Array of country objects with code and name
   */
  static getCountriesByContinent(continent) {
    if (!continent || continent === 'All' || continent === 'Global') {
      return [];
    }
    
    const stmt = db.prepare('SELECT DISTINCT country, full_country_name FROM talkgroups WHERE continent = ? ORDER BY country');
    return stmt.all(continent).map(row => ({
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
  static getTalkgroups({ continent, country = null }) {
    if (!continent || continent === 'All' || continent === 'Global') {
      return [];
    }
    
    let query = 'SELECT talkgroup_id, name FROM talkgroups WHERE continent = ?';
    const params = [continent];
    
    if (country) {
      query += ' AND country = ?';
      params.push(country);
    }
    
    query += ' ORDER BY talkgroup_id';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }
}

module.exports = {
  LastheardService,
  TalkgroupService
};
