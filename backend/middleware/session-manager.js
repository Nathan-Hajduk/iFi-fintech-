/**
 * Session Manager - Database-backed JWT token storage
 * Stores tokens in PostgreSQL for better security and session management
 */

const db = require('../config/database');

/**
 * Save session to database
 * @param {number} userId - User ID
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token  
 * @param {Object} req - Express request (for IP and user agent)
 * @param {Date} expiresAt - Token expiration date
 * @returns {Promise<Object>} Created session
 */
async function createSession(userId, accessToken, refreshToken, req, expiresAt) {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const result = await db.query(`
      INSERT INTO user_sessions (user_id, access_token, refresh_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, accessToken, refreshToken, ipAddress, userAgent, expiresAt]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Create session error:', error);
    throw error;
  }
}

/**
 * Validate session token in database
 * @param {string} accessToken - JWT access token to validate
 * @returns {Promise<Object|null>} Session object or null if invalid
 */
async function validateSession(accessToken) {
  try {
    // Update last_used_at and get session
    const result = await db.query(`
      UPDATE user_sessions
      SET last_used_at = NOW()
      WHERE access_token = $1
        AND expires_at > NOW()
      RETURNING *
    `, [accessToken]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Validate session error:', error);
    return null;
  }
}

/**
 * Get session by refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object|null>} Session object or null
 */
async function getSessionByRefreshToken(refreshToken) {
  try {
    const result = await db.query(`
      SELECT * FROM user_sessions
      WHERE refresh_token = $1
        AND expires_at > NOW()
    `, [refreshToken]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Get session by refresh token error:', error);
    return null;
  }
}

/**
 * Update session tokens
 * @param {number} sessionId - Session ID
 * @param {string} newAccessToken - New access token
 * @param {Date} expiresAt - New expiration date
 * @returns {Promise<Object>} Updated session
 */
async function updateSession(sessionId, newAccessToken, expiresAt) {
  try {
    const result = await db.query(`
      UPDATE user_sessions
      SET access_token = $1,
          expires_at = $2,
          last_used_at = NOW()
      WHERE session_id = $3
      RETURNING *
    `, [newAccessToken, expiresAt, sessionId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Update session error:', error);
    throw error;
  }
}

/**
 * Delete session (logout)
 * @param {string} accessToken - Access token to invalidate
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteSession(accessToken) {
  try {
    const result = await db.query(`
      DELETE FROM user_sessions
      WHERE access_token = $1
      RETURNING session_id
    `, [accessToken]);
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('Delete session error:', error);
    return false;
  }
}

/**
 * Delete all sessions for a user (logout all devices)
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of sessions deleted
 */
async function deleteAllUserSessions(userId) {
  try {
    const result = await db.query(`
      DELETE FROM user_sessions
      WHERE user_id = $1
      RETURNING session_id
    `, [userId]);
    
    return result.rowCount;
  } catch (error) {
    console.error('Delete all user sessions error:', error);
    return 0;
  }
}

/**
 * Get all active sessions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of active sessions
 */
async function getUserSessions(userId) {
  try {
    const result = await db.query(`
      SELECT session_id, ip_address, user_agent, created_at, last_used_at, expires_at
      FROM user_sessions
      WHERE user_id = $1
        AND expires_at > NOW()
      ORDER BY last_used_at DESC
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error('Get user sessions error:', error);
    return [];
  }
}

/**
 * Clean up expired sessions
 * @returns {Promise<number>} Number of sessions deleted
 */
async function cleanupExpiredSessions() {
  try {
    const result = await db.query(`
      DELETE FROM user_sessions
      WHERE expires_at < NOW()
      RETURNING session_id
    `);
    
    if (result.rowCount > 0) {
      console.log(`🧹 Cleaned up ${result.rowCount} expired sessions`);
    }
    
    return result.rowCount;
  } catch (error) {
    console.error('Cleanup expired sessions error:', error);
    return 0;
  }
}

module.exports = {
  createSession,
  validateSession,
  getSessionByRefreshToken,
  updateSession,
  deleteSession,
  deleteAllUserSessions,
  getUserSessions,
  cleanupExpiredSessions
};
