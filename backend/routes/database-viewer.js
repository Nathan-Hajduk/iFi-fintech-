/**
 * Database Viewer API - Protected route for viewing database tables
 * Provides a simple web interface to view database contents
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Password protection middleware
 */
const VIEWER_PASSWORD = process.env.DB_VIEWER_PASSWORD || 'NathanH_082204';

function authenticateViewer(req, res, next) {
  const password = req.headers['x-viewer-password'] || req.query.password;
  
  if (password !== VIEWER_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect password'
    });
  }
  
  next();
}

/**
 * GET /api/database/tables
 * Get list of all tables
 */
router.get('/tables', authenticateViewer, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        tablename as name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = pg_tables.tablename) as column_count
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    // Get row counts for each table
    const tables = await Promise.all(result.rows.map(async (table) => {
      const countResult = await db.query(`SELECT COUNT(*) FROM ${table.name}`);
      return {
        name: table.name,
        columns: parseInt(table.column_count),
        rows: parseInt(countResult.rows[0].count)
      };
    }));
    
    res.json({
      success: true,
      tables
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tables',
      error: error.message
    });
  }
});

/**
 * GET /api/database/table/:name
 * Get data from a specific table
 */
router.get('/table/:name', authenticateViewer, async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    // Validate table name exists
    const tableCheck = await db.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = $1
    `, [name]);
    
    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }
    
    // Get column info
    const columns = await db.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [name]);
    
    // Get data with pagination
    const data = await db.query(`
      SELECT * FROM ${name}
      ORDER BY 1
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    // Get total count
    const countResult = await db.query(`SELECT COUNT(*) FROM ${name}`);
    
    res.json({
      success: true,
      table: name,
      columns: columns.rows,
      data: data.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table data',
      error: error.message
    });
  }
});

/**
 * GET /api/database/health
 * Check database connection
 */
router.get('/health', authenticateViewer, async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, current_database() as database');
    
    res.json({
      success: true,
      database: result.rows[0].database,
      time: result.rows[0].current_time,
      connected: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

module.exports = router;
