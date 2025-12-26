/**
 * Create user_sessions table for storing JWT tokens
 */

require('dotenv').config();
const db = require('../config/database');

async function createSessionsTable() {
  const client = await db.getClient();
  
  try {
    console.log('📦 Dropping old user_sessions table if exists...');
    await client.query(`DROP TABLE IF EXISTS user_sessions CASCADE;`);
    
    console.log('📦 Creating user_sessions table...');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(access_token),
        UNIQUE(refresh_token)
      );
    `);
    
    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON user_sessions(access_token);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON user_sessions(refresh_token);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);`);
    
    console.log('✅ user_sessions table created successfully');
    
    // Add function to clean up expired sessions
    console.log('📦 Creating cleanup function...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
      RETURNS void AS $$
      BEGIN
        DELETE FROM user_sessions WHERE expires_at < NOW();
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Cleanup function created');
    
  } catch (error) {
    console.error('❌ Error creating sessions table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createSessionsTable()
    .then(() => {
      console.log('✅ Sessions table setup complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createSessionsTable };
