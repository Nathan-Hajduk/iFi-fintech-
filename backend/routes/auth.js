/**
 * Authentication Routes (PostgreSQL Version)
 * Handles user registration, login, token refresh, and password management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const sessionManager = require('../middleware/session-manager');
const db = require('../config/database');

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitStore = new Map();

/**
 * Check rate limit
 */
function checkRateLimit(key, maxAttempts, windowMs) {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { blocked: false, remaining: maxAttempts - 1 };
  }
  
  if (now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { blocked: false, remaining: maxAttempts - 1 };
  }
  
  if (record.count >= maxAttempts) {
    return { blocked: true, resetTime: record.resetTime };
  }
  
  record.count++;
  return { blocked: false, remaining: maxAttempts - record.count };
}

/**
 * Clear rate limit
 */
function clearRateLimit(key) {
  rateLimitStore.delete(key);
}

/**
 * Generate JWT token pair
 */
function generateTokenPair(payload) {
  const accessToken = jwt.sign(
    { 
      userId: payload.user_id, 
      email: payload.email, 
      role: payload.role || 'free',
      type: 'access'
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      issuer: 'iFi',
      audience: 'iFi-users'
    }
  );
  
  const refreshToken = jwt.sign(
    { 
      userId: payload.user_id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'iFi',
      audience: 'iFi-users'
    }
  );
  
  return { accessToken, refreshToken };
}

/**
 * Sanitize user object (remove sensitive data)
 */
function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * GET /api/check-email
 * Check if email already exists
 */
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }
    
    const result = await db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    res.json({
      success: true,
      exists: result.rows.length > 0
    });
    
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email',
      exists: false
    });
  }
});

/**
 * GET /api/check-phone
 * Check if phone number already exists
 */
router.get('/check-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone parameter is required'
      });
    }
    
    const result = await db.query(
      'SELECT user_id FROM users WHERE phone_number = $1',
      [phone]
    );
    
    res.json({
      success: true,
      exists: result.rows.length > 0
    });
    
  } catch (error) {
    console.error('Check phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking phone',
      exists: false
    });
  }
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;
    
    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (email, password, firstName, lastName)'
      });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Check rate limit
    const rateLimit = checkRateLimit(`register:${req.ip}`, 5, 60 * 60 * 1000);
    if (rateLimit.blocked) {
      return res.status(429).json({
        success: false,
        message: 'Too many registration attempts. Please try again later.'
      });
    }
    
    // Generate username if not provided
    const generatedUsername = username || email.split('@')[0] + Math.floor(Math.random() * 1000);
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT user_id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), generatedUsername]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or username already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const result = await db.query(
      `INSERT INTO users (
        email, 
        username,
        password, 
        first_name, 
        last_name, 
        subscription_type,
        role,
        email_verified,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, 'free', 'free', FALSE, TRUE)
      RETURNING user_id, email, username, first_name, last_name, subscription_type, role, created_at`,
      [email.toLowerCase(), generatedUsername, hashedPassword, firstName, lastName]
    );
    
    const user = result.rows[0];
    
    // Create initial user analytics record
    await db.query(
      `INSERT INTO user_analytics (user_id) VALUES ($1)`,
      [user.user_id]
    );
    
    // Generate tokens
    const tokens = generateTokenPair(user);
    
    // Store refresh token
    await db.query(
      `INSERT INTO session_tokens (user_id, refresh_token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
      [user.user_id, tokens.refreshToken, req.ip, req.headers['user-agent']]
    );
    
    // Clear rate limit
    clearRateLimit(`register:${req.ip}`);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: sanitizeUser(user),
      tokens
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email/username and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Validation
    if ((!email && !username) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
    }
    
    const loginIdentifier = email || username;
    
    // Check rate limit
    const rateLimit = checkRateLimit(`login:${loginIdentifier}:${req.ip}`, 5, 15 * 60 * 1000);
    if (rateLimit.blocked) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.'
      });
    }
    
    // Find user by email or username
    const result = await db.query(
      `SELECT * FROM users 
       WHERE (email = $1 OR username = $1) 
       AND is_active = TRUE`,
      [loginIdentifier.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }
    
    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );
    
    // Generate tokens
    const tokens = generateTokenPair(user);
    
    // Calculate expiration date (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Store session in new user_sessions table
    await sessionManager.createSession(
      user.user_id, 
      tokens.accessToken, 
      tokens.refreshToken, 
      req,
      expiresAt
    );
    
    // Store refresh token in legacy session_tokens table (for compatibility)
    await db.query(
      `INSERT INTO session_tokens (user_id, refresh_token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
      [user.user_id, tokens.refreshToken, req.ip, req.headers['user-agent']]
    );
    
    // Log audit event
    await db.query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
       VALUES ($1, 'login', $2, $3, $4)`,
      [user.user_id, JSON.stringify({ method: 'password' }), req.ip, req.headers['user-agent']]
    );
    
    // Clear rate limit
    clearRateLimit(`login:${loginIdentifier}:${req.ip}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: sanitizeUser(user),
      onboardingCompleted: user.onboarding_completed || false,
      tokens
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Check if refresh token exists in database and is not expired
    const tokenResult = await db.query(
      `SELECT * FROM session_tokens 
       WHERE refresh_token = $1 
       AND user_id = $2 
       AND expires_at > NOW()`,
      [refreshToken, decoded.userId]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found or expired'
      });
    }
    
    // Get user
    const userResult = await db.query(
      'SELECT * FROM users WHERE user_id = $1 AND is_active = TRUE',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    const user = userResult.rows[0];
    
    // Generate new access token with proper format
    const accessToken = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role || 'free',
        type: 'access'
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        issuer: 'iFi',
        audience: 'iFi-users'
      }
    );
    
    // Update session in user_sessions table with new token
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await sessionManager.updateSessionByRefreshToken(refreshToken, accessToken, expiresAt);
    
    res.json({
      success: true,
      accessToken
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while refreshing token'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate refresh token
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Delete the specific refresh token
      await db.query(
        'DELETE FROM session_tokens WHERE refresh_token = $1 AND user_id = $2',
        [refreshToken, req.user.userId]
      );
    } else {
      // Delete all refresh tokens for this user (logout from all devices)
      await db.query(
        'DELETE FROM session_tokens WHERE user_id = $1',
        [req.user.userId]
      );
    }
    
    // Log audit event
    await db.query(
      `INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
       VALUES ($1, 'logout', $2, $3, $4)`,
      [req.user.userId, JSON.stringify({}), req.ip, req.headers['user-agent']]
    );
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        user_id,
        email,
        username,
        first_name,
        last_name,
        subscription_type,
        role,
        email_verified,
        phone_number,
        created_at,
        last_login
      FROM users 
      WHERE user_id = $1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user data'
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user
    const result = await db.query(
      'SELECT user_id, email, first_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }
    
    const user = result.rows[0];
    
    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.user_id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Store reset token
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [user.user_id, resetToken]
    );
    
    // TODO: Send email with reset link
    // For now, just log it (in production, use email service)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);
    
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      // Remove this in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Check if token exists and is not used
    const tokenResult = await db.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 
       AND user_id = $2 
       AND used = FALSE 
       AND expires_at > NOW()`,
      [token, decoded.userId]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [hashedPassword, decoded.userId]
    );
    
    // Mark token as used
    await db.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
      [token]
    );
    
    // Invalidate all sessions
    await db.query(
      'DELETE FROM session_tokens WHERE user_id = $1',
      [decoded.userId]
    );
    
    res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting password'
    });
  }
});

module.exports = router;
