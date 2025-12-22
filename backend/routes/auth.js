/**
 * Authentication Routes
 * Handles user registration, login, token refresh, and password management
 */

const express = require('express');
const router = express.Router();
const {
  generateTokenPair,
  hashPassword,
  comparePassword,
  verifyToken,
  authenticate,
  checkRateLimit,
  clearRateLimit,
  sanitizeUser
} = require('../middleware/auth');
const db = require('../config/database');

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
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
    const rateLimit = checkRateLimit(`register:${req.ip}`, 5, 60 * 60 * 1000); // 5 attempts per hour
    if (rateLimit.blocked) {
      return res.status(429).json({
        success: false,
        message: 'Too many registration attempts. Please try again later.',
        resetTime: rateLimit.resetTime
      });
    }
    
    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const userId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (email, password, first_name, last_name, role, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email.toLowerCase(), hashedPassword, firstName, lastName, 'free', new Date().toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    // Get created user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Generate tokens
    const tokens = generateTokenPair({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    // Clear rate limit on successful registration
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
      message: 'An error occurred during registration'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Check rate limit
    const rateLimit = checkRateLimit(`login:${email}:${req.ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
    if (rateLimit.blocked) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.',
        resetTime: rateLimit.resetTime
      });
    }
    
    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        remaining: rateLimit.remaining
      });
    }
    
    // Update last login
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET last_login = ? WHERE id = ?',
        [new Date().toISOString(), user.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Generate tokens
    const tokens = generateTokenPair({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    // Clear rate limit on successful login
    clearRateLimit(`login:${email}:${req.ip}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: sanitizeUser(user),
      tokens
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
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
    const decoded = verifyToken(refreshToken, 'refresh');
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Get user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate new token pair
    const tokens = generateTokenPair({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      tokens
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during token refresh'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: sanitizeUser(user)
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred retrieving user data'
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
    
    // Check rate limit
    const rateLimit = checkRateLimit(`forgot:${email}`, 3, 60 * 60 * 1000); // 3 attempts per hour
    if (rateLimit.blocked) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset attempts. Please try again later.'
      });
    }
    
    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Always return success (security best practice - don't reveal if email exists)
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
    
    if (user) {
      // TODO: Generate reset token and send email
      // This would integrate with email service (Phase 7)
      console.log(`Password reset requested for user: ${user.email}`);
    }
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred processing your request'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }
    
    // Get user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred changing your password'
    });
  }
});

module.exports = router;
