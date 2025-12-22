/**
 * Database Migration Script
 * Updates existing database schema for Phase 3 (Authentication)
 */

const { pool } = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...\n');
    
    await client.query('BEGIN');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Users table does not exist. Run setup.js first.');
      await client.query('ROLLBACK');
      return;
    }
    
    console.log('✓ Users table exists');
    
    // Add new columns if they don't exist
    const columnsToAdd = [
      { name: 'role', type: 'VARCHAR(50)', default: "'free'" },
      { name: 'subscription_tier', type: 'VARCHAR(50)', default: "'free'" },
      { name: 'stripe_customer_id', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'is_active', type: 'BOOLEAN', default: 'TRUE' },
      { name: 'email_verified', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'last_login', type: 'TIMESTAMP', default: 'NULL' },
      { name: 'phone_number', type: 'VARCHAR(20)', default: 'NULL' }
    ];
    
    for (const col of columnsToAdd) {
      try {
        // Check if column exists
        const colCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = $1;
        `, [col.name]);
        
        if (colCheck.rows.length === 0) {
          await client.query(`
            ALTER TABLE users 
            ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default};
          `);
          console.log(`✓ Added column: ${col.name}`);
        } else {
          console.log(`- Column already exists: ${col.name}`);
        }
      } catch (error) {
        console.error(`✗ Error adding column ${col.name}:`, error.message);
      }
    }
    
    // Rename password_hash to password if it exists
    try {
      const passwordHashCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash';
      `);
      
      if (passwordHashCheck.rows.length > 0) {
        await client.query(`
          ALTER TABLE users RENAME COLUMN password_hash TO password;
        `);
        console.log('✓ Renamed password_hash to password');
      }
    } catch (error) {
      console.log('- Password column already correct');
    }
    
    // Add check constraint for role
    try {
      await client.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
          ) THEN
            ALTER TABLE users ADD CONSTRAINT users_role_check 
            CHECK (role IN ('free', 'premium', 'enterprise', 'admin'));
          END IF;
        END $$;
      `);
      console.log('✓ Added role check constraint');
    } catch (error) {
      console.log('- Role constraint already exists');
    }
    
    // Create session tokens table for refresh tokens
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        ip_address VARCHAR(45),
        user_agent TEXT
      );
    `);
    console.log('✓ Created session_tokens table');
    
    // Create index on session tokens
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_user_id ON session_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_session_expires ON session_tokens(expires_at);
    `);
    console.log('✓ Created session token indexes');
    
    // Create password reset tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created password_reset_tokens table');
    
    // Create email verification tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created email_verification_tokens table');
    
    // Create audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created audit_log table');
    
    // Create index on audit log
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
    `);
    console.log('✓ Created audit log indexes');
    
    await client.query('COMMIT');
    
    console.log('\n✅ Migration completed successfully!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrate();
