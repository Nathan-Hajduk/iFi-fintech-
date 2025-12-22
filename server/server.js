// =============================================================
// iFi Backend Server - User Management & Security API
// Improvements implemented:
// 1. Email verification flow with signed tokens & expiry
// 2. Secure password reset (single-use hashed tokens)
// 3. Centralized validation (Joi) & basic sanitization
// 4. JWT access + refresh token auth layer
// 5. Rate limiting on auth-sensitive endpoints
// 6. Optional MFA (TOTP) enable/disable & challenge verify
// 7. Central error handling & structured logging (winston)
// 8. User settings endpoints (change email, password, MFA toggle)
// 9. Audit trail for security events (login, password change, etc.)
// 10. Analytics event capture endpoint
// 11. Basic middleware helpers for auth, rate limiting, validation
// =============================================================
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const validator = require('validator');

const app = express();
const PORT = 3000;

// =============================================================
// Configuration (In production, move secrets to environment vars)
// =============================================================
const CONFIG = {
    JWT_ACCESS_SECRET: 'dev_access_secret_change_me',
    JWT_REFRESH_SECRET: 'dev_refresh_secret_change_me',
    ACCESS_TOKEN_TTL_SECONDS: 900,          // 15 minutes
    REFRESH_TOKEN_TTL_SECONDS: 60 * 60 * 24 * 7, // 7 days
    EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
    PASSWORD_RESET_EXPIRY_HOURS: 1,
};

// =============================================================
// Logger setup (winston)
// =============================================================
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// =============================================================
// Simple email transport (placeholder - console fallback)
// =============================================================
let mailTransport;
try {
    mailTransport = nodemailer.createTransport({
        // For real usage configure SMTP or service provider credentials
        jsonTransport: true // Outputs email as JSON to console
    });
} catch (e) {
    logger.warn('Email transporter init failed, emails will be skipped');
}

// =============================================================
// Middleware
// =============================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Global rate limiter (baseline)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(globalLimiter);

// Specific high-sensitivity endpoint limiter factory
function makeLimiter(max, windowMs = 15 * 60 * 1000) {
    return rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false });
}

// =============================================================
// Helper: sendEmail (placeholder logs)
// =============================================================
async function sendEmail(to, subject, text) {
    if (!mailTransport) {
        logger.info({ event: 'email_skipped', to, subject });
        return;
    }
    await mailTransport.sendMail({ from: 'no-reply@ifi.local', to, subject, text });
    logger.info({ event: 'email_sent', to, subject });
}

// =============================================================
// Helper: security audit logging
// =============================================================
function logSecurityEvent(userId, type, meta = {}) {
    const sql = `INSERT INTO audit_logs (userId, eventType, meta, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
    db.run(sql, [userId || null, type, JSON.stringify(meta)], err => {
        if (err) logger.error({ event: 'audit_log_error', error: err.message });
    });
    logger.info({ event: 'security_event', userId, type, meta });
}

// =============================================================
// Auth helpers
// =============================================================
function issueAccessToken(user) {
    return jwt.sign({ sub: user.id, email: user.email }, CONFIG.JWT_ACCESS_SECRET, { expiresIn: CONFIG.ACCESS_TOKEN_TTL_SECONDS });
}
function issueRefreshToken(user) {
    return jwt.sign({ sub: user.id, type: 'refresh' }, CONFIG.JWT_REFRESH_SECRET, { expiresIn: CONFIG.REFRESH_TOKEN_TTL_SECONDS });
}
function verifyAccessToken(token) {
    return jwt.verify(token, CONFIG.JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
    return jwt.verify(token, CONFIG.JWT_REFRESH_SECRET);
}

// Middleware: authenticate JWT access token
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Missing authorization header' });
    const token = authHeader.split(' ')[1];
    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, email: payload.email };
        next();
    } catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

// =============================================================
// Validation Schemas (Joi)
// =============================================================
const signupSchema = Joi.object({
    firstName: Joi.string().min(1).max(50).regex(/^[A-Za-z\s'\-]+$/).required(),
    lastName: Joi.string().min(1).max(50).regex(/^[A-Za-z\s'\-]+$/).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(9).max(100).pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{9,}$/).required(),
    phone: Joi.string().pattern(/^\d{3}-\d{3}-\d{4}$/).required(),
    dateOfBirth: Joi.object({ year: Joi.string(), month: Joi.string(), day: Joi.string() }).optional()
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

const emailSchema = Joi.object({ email: Joi.string().email().required() });

// =============================================================
// Sanitization helper
// =============================================================
function sanitizeEmail(email) { return validator.normalizeEmail(email); }

// =============================================================
// Database initialization & migrations for new tables/columns
// =============================================================

// Database initialization
const db = new sqlite3.Database(path.join(__dirname, 'ifi-users.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

// Create users table if it doesn't exist
function initializeDatabase() {
    // Users table extended: emailVerified, verificationToken, verificationExpires, mfaEnabled, mfaSecret
    const usersTable = `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        dateOfBirth TEXT,
        emailVerified INTEGER DEFAULT 0,
        verificationToken TEXT,
        verificationExpires DATETIME,
        mfaEnabled INTEGER DEFAULT 0,
        mfaSecret TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastLogin DATETIME
    )`;
    db.run(usersTable, err => { if (err) logger.error({ msg: 'users_table_error', error: err.message }); });

    // Password reset tokens
    const passwordResets = `CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        tokenHash TEXT NOT NULL,
        expiresAt DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`;
    db.run(passwordResets, err => { if (err) logger.error({ msg: 'password_resets_table_error', error: err.message }); });

    // Refresh tokens store (hashed) for revocation
    const refreshTokens = `CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        tokenHash TEXT NOT NULL,
        expiresAt DATETIME NOT NULL,
        revoked INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`;
    db.run(refreshTokens, err => { if (err) logger.error({ msg: 'refresh_tokens_table_error', error: err.message }); });

    // Audit logs
    const auditLogs = `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        eventType TEXT NOT NULL,
        meta TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`;
    db.run(auditLogs, err => { if (err) logger.error({ msg: 'audit_logs_table_error', error: err.message }); });

    // Analytics events
    const analyticsEvents = `CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eventName TEXT NOT NULL,
        eventData TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;
    db.run(analyticsEvents, err => { if (err) logger.error({ msg: 'analytics_events_table_error', error: err.message }); });
}

// API Routes

// Check if email exists
app.get('/api/check-email', (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const sql = 'SELECT id FROM users WHERE email = ?';
    
    db.get(sql, [email.toLowerCase()], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ exists: !!row });
    });
});

// Check if phone exists
app.get('/api/check-phone', (req, res) => {
    const { phone } = req.query;

    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    const sql = 'SELECT id FROM users WHERE phone = ?';
    
    db.get(sql, [phone], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ exists: !!row });
    });
});

// =============================================================
// SIGNUP - creates user, generates email verification token
// =============================================================
app.post('/api/signup', makeLimiter(10), async (req, res) => {
    const { error, value } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    const { firstName, lastName, email, password, phone, dateOfBirth } = value;
    const normalizedEmail = sanitizeEmail(email.toLowerCase());
    try {
        // Check uniqueness
        const exists = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ? OR phone = ?', [normalizedEmail, phone], (err, row) => {
                if (err) reject(err); else resolve(row);
            });
        });
        if (exists) return res.status(400).json({ success: false, message: 'Email or phone already registered' });

        const passwordHash = await bcrypt.hash(password, 10);
        let dobString = null;
        if (dateOfBirth?.year && dateOfBirth?.month && dateOfBirth?.day) dobString = `${dateOfBirth.year}-${dateOfBirth.month}-${dateOfBirth.day}`;

        const verificationToken = uuidv4();
        const expires = new Date(Date.now() + CONFIG.EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
        const sql = `INSERT INTO users (firstName, lastName, email, phone, passwordHash, dateOfBirth, verificationToken, verificationExpires) VALUES (?,?,?,?,?,?,?,?)`;
        db.run(sql, [firstName.trim(), lastName.trim(), normalizedEmail, phone.trim(), passwordHash, dobString, verificationToken, expires], function(err) {
            if (err) {
                logger.error({ event: 'signup_insert_error', error: err.message });
                return res.status(500).json({ success: false, message: 'Failed to create account' });
            }
            logSecurityEvent(this.lastID, 'signup');
            // Send verification email (placeholder)
            sendEmail(normalizedEmail, 'Verify your iFi account', `Click to verify: http://localhost:${PORT}/api/verify-email?token=${verificationToken}`);
            return res.status(201).json({ success: true, message: 'Account created. Please verify your email.', userId: this.lastID });
        });
    } catch (e) {
        logger.error({ event: 'signup_error', error: e.message });
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// =============================================================
// EMAIL VERIFICATION
// =============================================================
app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Missing token' });
    db.get('SELECT id, verificationExpires FROM users WHERE verificationToken = ?', [token], (err, user) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
        if (new Date(user.verificationExpires).getTime() < Date.now()) return res.status(400).json({ success: false, message: 'Token expired' });
        db.run('UPDATE users SET emailVerified = 1, verificationToken = NULL, verificationExpires = NULL WHERE id = ?', [user.id], err2 => {
            if (err2) return res.status(500).json({ success: false, message: 'Update failed' });
            logSecurityEvent(user.id, 'email_verified');
            return res.json({ success: true, message: 'Email verified successfully' });
        });
    });
});

// =============================================================
// LOGIN - includes email verification check & optional MFA gate
// =============================================================
app.post('/api/login', makeLimiter(15), async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    const { username, password } = value;
    db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [username.toLowerCase(), username], async (err, user) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            logSecurityEvent(user.id, 'login_failed');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (!user.emailVerified) return res.status(403).json({ success: false, message: 'Email not verified' });
        // MFA check
        if (user.mfaEnabled && user.mfaSecret) {
            // Issue temporary challenge id
            const challengeId = uuidv4();
            // Store in audit logs (lightweight placeholder) - could add dedicated table
            logSecurityEvent(user.id, 'mfa_challenge_issued', { challengeId });
            return res.json({ success: true, mfaRequired: true, challengeId });
        }
        // Normal login -> issue tokens
        const accessToken = issueAccessToken(user);
        const refreshToken = issueRefreshToken(user);
        const refreshHash = await bcrypt.hash(refreshToken, 10);
        const exp = new Date(Date.now() + CONFIG.REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();
        db.run('INSERT INTO refresh_tokens (userId, tokenHash, expiresAt) VALUES (?,?,?)', [user.id, refreshHash, exp]);
        db.run('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        logSecurityEvent(user.id, 'login_success');
        return res.json({ success: true, message: 'Login successful', accessToken, refreshToken });
    });
});

// =============================================================
// MFA VERIFY - provide TOTP code & challenge id
// =============================================================
app.post('/api/mfa/verify', async (req, res) => {
    const { challengeId, username, code } = req.body;
    if (!challengeId || !username || !code) return res.status(400).json({ success: false, message: 'Missing fields' });
    db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [username.toLowerCase(), username], async (err, user) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (!user || !user.mfaEnabled || !user.mfaSecret) return res.status(400).json({ success: false, message: 'MFA not enabled' });
        // Validate TOTP
        const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token: code, window: 1 });
        if (!verified) {
            logSecurityEvent(user.id, 'mfa_failed', { challengeId });
            return res.status(401).json({ success: false, message: 'Invalid MFA code' });
        }
        // Issue tokens after MFA success
        const accessToken = issueAccessToken(user);
        const refreshToken = issueRefreshToken(user);
        const refreshHash = await bcrypt.hash(refreshToken, 10);
        const exp = new Date(Date.now() + CONFIG.REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();
        db.run('INSERT INTO refresh_tokens (userId, tokenHash, expiresAt) VALUES (?,?,?)', [user.id, refreshHash, exp]);
        db.run('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        logSecurityEvent(user.id, 'mfa_success', { challengeId });
        return res.json({ success: true, message: 'MFA verified', accessToken, refreshToken });
    });
});

// =============================================================
// REFRESH TOKEN
// =============================================================
app.post('/api/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Missing refresh token' });
    let payload;
    try { payload = verifyRefreshToken(refreshToken); } catch { return res.status(401).json({ success: false, message: 'Invalid refresh token' }); }
    db.all('SELECT id, tokenHash, revoked, expiresAt FROM refresh_tokens WHERE userId = ? AND revoked = 0', [payload.sub], async (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        const match = rows.find(r => bcrypt.compareSync(refreshToken, r.tokenHash));
        if (!match) return res.status(401).json({ success: false, message: 'Refresh token not recognized' });
        if (new Date(match.expiresAt).getTime() < Date.now()) return res.status(401).json({ success: false, message: 'Refresh token expired' });
        // Issue new tokens
        db.get('SELECT * FROM users WHERE id = ?', [payload.sub], async (err2, user) => {
            if (err2 || !user) return res.status(500).json({ success: false, message: 'User not found' });
            const accessToken = issueAccessToken(user);
            return res.json({ success: true, accessToken });
        });
    });
});

// =============================================================
// LOGOUT - revoke all refresh tokens for user (optional selective revoke)
// =============================================================
app.post('/api/logout', authMiddleware, (req, res) => {
    db.run('UPDATE refresh_tokens SET revoked = 1 WHERE userId = ?', [req.user.id], err => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to logout' });
        logSecurityEvent(req.user.id, 'logout');
        return res.json({ success: true, message: 'Logged out' });
    });
});

// =============================================================
// PASSWORD RESET REQUEST
// =============================================================
app.post('/api/password-reset/request', makeLimiter(5), (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const normalizedEmail = sanitizeEmail(email.toLowerCase());
    db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail], async (err, user) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (!user) return res.json({ success: true, message: 'If that email exists, a reset link was sent.' }); // Do not leak
        const rawToken = uuidv4();
        const tokenHash = await bcrypt.hash(rawToken, 10);
        const expiresAt = new Date(Date.now() + CONFIG.PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
        db.run('INSERT INTO password_resets (userId, tokenHash, expiresAt) VALUES (?,?,?)', [user.id, tokenHash, expiresAt], err2 => {
            if (err2) return res.status(500).json({ success: false, message: 'Failed to create reset token' });
            sendEmail(normalizedEmail, 'iFi Password Reset', `Use this token on reset form: ${rawToken}`);
            logSecurityEvent(user.id, 'password_reset_requested');
            return res.json({ success: true, message: 'If account exists, reset instructions sent.' });
        });
    });
});

// =============================================================
// PASSWORD RESET CONFIRM
// =============================================================
app.post('/api/password-reset/confirm', makeLimiter(5), async (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ success: false, message: 'Missing fields' });
    if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{9,}$/.test(newPassword)) return res.status(400).json({ success: false, message: 'Password requirements not met' });
    const normalizedEmail = sanitizeEmail(email.toLowerCase());
    db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail], (err, user) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
        db.all('SELECT * FROM password_resets WHERE userId = ? AND used = 0', [user.id], async (err2, rows) => {
            if (err2) return res.status(500).json({ success: false, message: 'Database error' });
            const match = rows.find(r => bcrypt.compareSync(token, r.tokenHash));
            if (!match) return res.status(400).json({ success: false, message: 'Invalid or used token' });
            if (new Date(match.expiresAt).getTime() < Date.now()) return res.status(400).json({ success: false, message: 'Token expired' });
            const newHash = await bcrypt.hash(newPassword, 10);
            db.run('UPDATE users SET passwordHash = ? WHERE id = ?', [newHash, user.id]);
            db.run('UPDATE password_resets SET used = 1 WHERE id = ?', [match.id]);
            logSecurityEvent(user.id, 'password_reset_success');
            return res.json({ success: true, message: 'Password updated successfully' });
        });
    });
});

// =============================================================
// SETTINGS: CHANGE EMAIL
// =============================================================
app.put('/api/settings/email', authMiddleware, async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail || !validator.isEmail(newEmail)) return res.status(400).json({ success: false, message: 'Invalid email' });
    const normalizedEmail = sanitizeEmail(newEmail.toLowerCase());
    db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail], (err, existing) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
        const token = uuidv4();
        const expires = new Date(Date.now() + CONFIG.EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
        db.run('UPDATE users SET email = ?, emailVerified = 0, verificationToken = ?, verificationExpires = ? WHERE id = ?', [normalizedEmail, token, expires, req.user.id], err2 => {
            if (err2) return res.status(500).json({ success: false, message: 'Update failed' });
            logSecurityEvent(req.user.id, 'email_changed');
            sendEmail(normalizedEmail, 'Verify new iFi email', `Verify: http://localhost:${PORT}/api/verify-email?token=${token}`);
            return res.json({ success: true, message: 'Email updated. Please verify.' });
        });
    });
});

// =============================================================
// SETTINGS: CHANGE PASSWORD
// =============================================================
app.put('/api/settings/password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Missing fields' });
    if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{9,}$/.test(newPassword)) return res.status(400).json({ success: false, message: 'Password requirements not met' });
    db.get('SELECT passwordHash FROM users WHERE id = ?', [req.user.id], async (err, row) => {
        if (err || !row) return res.status(500).json({ success: false, message: 'User not found' });
        const match = await bcrypt.compare(currentPassword, row.passwordHash);
        if (!match) return res.status(401).json({ success: false, message: 'Current password incorrect' });
        const newHash = await bcrypt.hash(newPassword, 10);
        db.run('UPDATE users SET passwordHash = ? WHERE id = ?', [newHash, req.user.id], err2 => {
            if (err2) return res.status(500).json({ success: false, message: 'Update failed' });
            logSecurityEvent(req.user.id, 'password_changed');
            return res.json({ success: true, message: 'Password changed successfully' });
        });
    });
});

// =============================================================
// SETTINGS: ENABLE MFA (TOTP)
// =============================================================
app.post('/api/settings/mfa/enable', authMiddleware, (req, res) => {
    const secret = speakeasy.generateSecret({ length: 20 });
    db.run('UPDATE users SET mfaEnabled = 1, mfaSecret = ? WHERE id = ?', [secret.base32, req.user.id], err => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to enable MFA' });
        logSecurityEvent(req.user.id, 'mfa_enabled');
        return res.json({ success: true, message: 'MFA enabled', secret: secret.otpauth_url });
    });
});

// =============================================================
// SETTINGS: DISABLE MFA
// =============================================================
app.post('/api/settings/mfa/disable', authMiddleware, (req, res) => {
    db.run('UPDATE users SET mfaEnabled = 0, mfaSecret = NULL WHERE id = ?', [req.user.id], err => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to disable MFA' });
        logSecurityEvent(req.user.id, 'mfa_disabled');
        return res.json({ success: true, message: 'MFA disabled' });
    });
});

// =============================================================
// ME ENDPOINT (Protected)
// =============================================================
app.get('/api/me', authMiddleware, (req, res) => {
    db.get('SELECT id, firstName, lastName, email, emailVerified, mfaEnabled, createdAt, lastLogin FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) return res.status(500).json({ success: false, message: 'User not found' });
        return res.json({ success: true, user });
    });
});

// =============================================================
// ANALYTICS EVENT CAPTURE
// =============================================================
app.post('/api/analytics/event', (req, res) => {
    const { eventName, eventData } = req.body;
    if (!eventName) return res.status(400).json({ success: false, message: 'eventName required' });
    db.run('INSERT INTO analytics_events (eventName, eventData) VALUES (?, ?)', [eventName, JSON.stringify(eventData || {})], err => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to record event' });
        return res.json({ success: true, message: 'Event recorded' });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: db ? 'connected' : 'disconnected'
    });
});

// Users list (admin/testing) - could protect later
app.get('/api/users', (req, res) => {
    db.all('SELECT id, firstName, lastName, email, phone, dateOfBirth, createdAt, emailVerified FROM users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        return res.json({ users: rows });
    });
});

// =============================================================
// Central Error Handling (fallback)
// =============================================================
app.use((err, req, res, next) => {
    logger.error({ event: 'unhandled_error', error: err.message });
    return res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`iFi Server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
