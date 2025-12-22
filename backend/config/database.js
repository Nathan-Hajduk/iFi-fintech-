/**
 * iFi Backend - Database Configuration and Connection Pool
 * PostgreSQL database setup with connection pooling
 */

const { Pool } = require('pg');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ifi_db',
  user: process.env.DB_USER || 'ifi_user',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool error handler
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Pool connection event
pool.on('connect', (client) => {
  console.log('New database client connected');
});

// Pool removal event
pool.on('remove', (client) => {
  console.log('Database client removed from pool');
});

/**
 * Execute a single query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

/**
 * Get a client from the pool (for transactions)
 * @returns {Promise} Database client
 */
async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query;
  const originalRelease = client.release;
  
  // Set a timeout for the client
  const timeout = setTimeout(() => {
    console.error('Client has been checked out for more than 5 seconds!');
  }, 5000);
  
  // Override query method to log
  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery.apply(client, args);
  };
  
  // Override release method to clear timeout
  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease.apply(client);
  };
  
  return client;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

/**
 * Initialize database tables
 * @returns {Promise<void>}
 */
async function initializeTables() {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Create users table (if not exists)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20),
        role VARCHAR(50) DEFAULT 'free' CHECK (role IN ('free', 'premium', 'enterprise', 'admin')),
        subscription_tier VARCHAR(50) DEFAULT 'free',
        stripe_customer_id VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create plaid_connections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plaid_connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id VARCHAR(255) UNIQUE NOT NULL,
        access_token TEXT NOT NULL,
        institution_id VARCHAR(255),
        institution_name VARCHAR(255),
        accounts JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'reauth_required', 'disconnected')),
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plaid_connection_id INTEGER REFERENCES plaid_connections(id) ON DELETE CASCADE,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        account_id VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        name VARCHAR(255) NOT NULL,
        merchant_name VARCHAR(255),
        category VARCHAR(100),
        subcategory VARCHAR(100),
        pending BOOLEAN DEFAULT FALSE,
        payment_channel VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plaid_user_id ON plaid_connections(user_id);
      CREATE INDEX IF NOT EXISTS idx_plaid_item_id ON plaid_connections(item_id);
      CREATE INDEX IF NOT EXISTS idx_plaid_status ON plaid_connections(status);
      
      CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transaction_category ON transactions(category);
      CREATE INDEX IF NOT EXISTS idx_transaction_pending ON transactions(pending);
      CREATE INDEX IF NOT EXISTS idx_transaction_account_id ON transactions(account_id);
    `);
    
    await client.query('COMMIT');
    console.log('Database tables initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
async function close() {
  await pool.end();
  console.log('Database connection pool closed');
}

module.exports = {
  query,
  getClient,
  testConnection,
  initializeTables,
  close,
  pool
};
