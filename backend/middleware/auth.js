/**
 * JWT Authentication Middleware
 * Handles token generation, validation, and user authentication
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Environment configuration
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = '15m'; // Access token expires in 15 minutes
const JWT_REFRESH_EXPIRES_IN = '7d'; // Refresh token expires in 7 days

/**
 * Generate JWT access token
 * @param {Object} user - User object with id, email, role
 * @returns {string} JWT access token
 */
function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'free',
    type: 'access'
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'iFi',
    audience: 'iFi-users'
  });
}

/**
 * Generate JWT refresh token
 * @param {Object} user - User object with id
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(user) {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'iFi',
    audience: 'iFi-users'
  });
}

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object with accessToken and refreshToken
 */
function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: JWT_EXPIRES_IN
  };
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} type - 'access' or 'refresh'
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token, type = 'access') {
  try {
    const secret = type === 'refresh' ? JWT_REFRESH_SECRET : JWT_SECRET;
    const decoded = jwt.verify(token, secret, {
      issuer: 'iFi',
      audience: 'iFi-users'
    });
    
    // Verify token type matches
    if (decoded.type !== type) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Authentication middleware - Verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token, 'access');
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred.'
    });
  }
}

/**
 * Optional authentication - Attach user if token is valid, but don't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token, 'access');
      
      if (decoded) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue even if there's an error
    next();
  }
}

/**
 * Role-based access control middleware
 * @param {string|Array<string>} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
function requireRole(allowedRoles) {
  // Convert single role to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
        requiredRole: roles,
        userRole: req.user.role
      });
    }
    
    next();
  };
}

/**
 * Premium subscription middleware
 * Requires user to have premium or admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  const premiumRoles = ['premium', 'admin'];
  
  if (!premiumRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required to access this feature.',
      upgradeRequired: true,
      userRole: req.user.role
    });
  }
  
  next();
}

/**
 * Rate limiting helper - Track request attempts
 * @param {string} identifier - Unique identifier (email, IP, etc.)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Object with blocked status and remaining attempts
 */
const rateLimitStore = new Map();

function checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      resetTime: now + windowMs
    });
    return { blocked: false, remaining: maxAttempts - 1 };
  }
  
  // Reset if window has expired
  if (now > record.resetTime) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      resetTime: now + windowMs
    });
    return { blocked: false, remaining: maxAttempts - 1 };
  }
  
  // Increment attempts
  record.attempts++;
  
  if (record.attempts > maxAttempts) {
    return {
      blocked: true,
      remaining: 0,
      resetTime: record.resetTime
    };
  }
  
  return {
    blocked: false,
    remaining: maxAttempts - record.attempts
  };
}

/**
 * Clear rate limit for identifier
 * @param {string} identifier - Unique identifier
 */
function clearRateLimit(identifier) {
  rateLimitStore.delete(identifier);
}

/**
 * Sanitize user object for API response (remove sensitive data)
 * @param {Object} user - User object from database
 * @returns {Object} Sanitized user object
 */
function sanitizeUser(user) {
  const { password, resetToken, refreshToken, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  // Token functions
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  
  // Password functions
  hashPassword,
  comparePassword,
  
  // Middleware
  authenticate,
  optionalAuth,
  requireRole,
  requirePremium,
  
  // Rate limiting
  checkRateLimit,
  clearRateLimit,
  
  // Utilities
  sanitizeUser,
  
  // Constants
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
};
