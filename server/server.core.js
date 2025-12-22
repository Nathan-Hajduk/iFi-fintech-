// =============================================================
// iFi Backend Server (Core) - Beginner Friendly Version
// What this file is: a minimal API you can explain clearly.
// What's included: signup, login, list users, health check.
// What's NOT included: JWTs, refresh tokens, MFA, email flows.
// =============================================================
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000; // same port as advanced server; run only one at a time

// -------------------------------------------------------------
// Middleware
// -------------------------------------------------------------
app.use(cors());
app.use(express.json());
// Serve the frontend (project root) so you can open pages easily
app.use(express.static(path.join(__dirname, '..')));

// -------------------------------------------------------------
// Database setup (SQLite file stored in server folder)
// -------------------------------------------------------------
const db = new sqlite3.Database(path.join(__dirname, 'ifi-users.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Improve concurrency on Windows/OneDrive by reducing lock contention
    db.serialize(() => {
      db.run('PRAGMA journal_mode = WAL');
      db.run('PRAGMA busy_timeout = 5000');
      db.run('PRAGMA synchronous = NORMAL');
    });
    initializeDatabase();
  }
});

function initializeDatabase() {
  const usersTable = `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    dateOfBirth TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`;
  db.run(usersTable, (err) => {
    if (err) console.error('users table error:', err.message);
  });
}

// -------------------------------------------------------------
// Health check
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: db ? 'connected' : 'disconnected' });
});

// -------------------------------------------------------------
// Duplicate checks (email/phone)
// -------------------------------------------------------------
app.get('/api/check-email', (req, res) => {
  const email = (req.query.email || '').toString().trim().toLowerCase();
  if (!email) return res.status(400).json({ exists: false, message: 'Missing email' });
  db.get('SELECT 1 FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ exists: false, message: 'Database error' });
    return res.json({ exists: !!row });
  });
});

app.get('/api/check-phone', (req, res) => {
  const phone = (req.query.phone || '').toString().trim();
  if (!phone) return res.status(400).json({ exists: false, message: 'Missing phone' });
  db.get('SELECT 1 FROM users WHERE phone = ?', [phone], (err, row) => {
    if (err) return res.status(500).json({ exists: false, message: 'Database error' });
    return res.json({ exists: !!row });
  });
});

// -------------------------------------------------------------
// Signup (very simple validation to keep it understandable)
// -------------------------------------------------------------
app.post('/api/signup', async (req, res) => {
  const { firstName, lastName, email, password, phone, dateOfBirth } = req.body || {};
  if (!firstName || !lastName || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  try {
    // Check if email or phone already exists
    db.get('SELECT id FROM users WHERE email = ? OR phone = ?', [email.toLowerCase(), phone], async (err, row) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (row) return res.status(400).json({ success: false, message: 'Email or phone already registered' });

      const passwordHash = await bcrypt.hash(password, 10);
      const dobString = dateOfBirth && dateOfBirth.year && dateOfBirth.month && dateOfBirth.day
        ? `${dateOfBirth.year}-${dateOfBirth.month}-${dateOfBirth.day}`
        : null;

      const sql = `INSERT INTO users (firstName, lastName, email, phone, passwordHash, dateOfBirth)
                   VALUES (?,?,?,?,?,?)`;
      db.run(sql, [firstName.trim(), lastName.trim(), email.toLowerCase().trim(), phone.trim(), passwordHash, dobString], function (insertErr) {
        if (insertErr) {
          console.error('Signup insert error:', insertErr.message);
          return res.status(500).json({ success: false, message: 'Failed to create account', error: insertErr.message });
        }
        return res.status(201).json({ success: true, message: 'Account created', userId: this.lastID });
      });
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -------------------------------------------------------------
// Login (checks password and returns a simple success)
// Note: No sessions/tokens here to keep it simple for learning.
// -------------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });
  db.get('SELECT * FROM users WHERE email = ? OR phone = ?', [username.toLowerCase(), username], async (err, user) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    // For learning: just confirm login; your frontend can treat this as "logged in"
    return res.json({ success: true, message: 'Login successful', user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } });
  });
});

// -------------------------------------------------------------
// List users (for testing and learning)
// -------------------------------------------------------------
app.get('/api/users', (req, res) => {
  db.all('SELECT id, firstName, lastName, email, phone, dateOfBirth, createdAt FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    return res.json({ success: true, users: rows });
  });
});

// -------------------------------------------------------------
// Start server
// -------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Core iFi Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err.message);
    console.log('Database connection closed.');
    process.exit(0);
  });
});
