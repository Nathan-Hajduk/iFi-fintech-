/**
 * Database Initialization Script
 * Creates all required tables for iFi application
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ifi_db',
  user: process.env.DB_USER || 'ifi_user',
  password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🗄️  Initializing iFi Database...\n');
    
    await client.query('BEGIN');
    
    // 1. Create users table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        subscription_type VARCHAR(50) DEFAULT 'free',
        role VARCHAR(50) DEFAULT 'free',
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        stripe_customer_id VARCHAR(255),
        phone_number VARCHAR(20),
        onboarding_completed BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT users_role_check CHECK (role IN ('free', 'premium', 'ifi_plus', 'enterprise', 'admin')),
        CONSTRAINT users_subscription_check CHECK (subscription_type IN ('free', 'premium', 'ifi_plus', 'enterprise'))
      );
    `);
    console.log('✓ Users table created');
    
    // 2. Create session tokens table
    console.log('Creating session_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT
      );
    `);
    console.log('✓ Session tokens table created');
    
    // 3. Create password reset tokens table
    console.log('Creating password_reset_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Password reset tokens table created');
    
    // 4. Create email verification tokens table
    console.log('Creating email_verification_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Email verification tokens table created');
    
    // 5. Create audit log table
    console.log('Creating audit_log table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Audit log table created');
    
    // 6. Create AI conversations table
    console.log('Creating ai_conversations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        conversation_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        message_role VARCHAR(20) NOT NULL CHECK (message_role IN ('user', 'assistant')),
        message_content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `);
    console.log('✓ AI conversations table created');
    
    // 7. Create Plaid items table
    console.log('Creating plaid_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS plaid_items (
        item_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        plaid_item_id VARCHAR(255) UNIQUE NOT NULL,
        plaid_access_token TEXT NOT NULL,
        institution_id VARCHAR(255),
        institution_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Plaid items table created');
    
    // 8. Create accounts table
    console.log('Creating accounts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        account_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES plaid_items(item_id) ON DELETE CASCADE,
        plaid_account_id VARCHAR(255) UNIQUE,
        account_name VARCHAR(255),
        account_type VARCHAR(50),
        account_subtype VARCHAR(50),
        mask VARCHAR(10),
        current_balance DECIMAL(15, 2),
        available_balance DECIMAL(15, 2),
        currency VARCHAR(10) DEFAULT 'USD',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Accounts table created');
    
    // 9. Create transactions table
    console.log('Creating transactions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES accounts(account_id) ON DELETE CASCADE,
        plaid_transaction_id VARCHAR(255) UNIQUE,
        transaction_date DATE NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description VARCHAR(500),
        category VARCHAR(100),
        merchant_name VARCHAR(255),
        pending BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Transactions table created');
    
    // 10. Create user_onboarding table
    console.log('Creating user_onboarding table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_onboarding (
        onboarding_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        employment_status VARCHAR(50),
        annual_income DECIMAL(15, 2),
        monthly_expenses DECIMAL(15, 2),
        debt_amount DECIMAL(15, 2),
        savings_goal DECIMAL(15, 2),
        investment_experience VARCHAR(50),
        risk_tolerance VARCHAR(50),
        financial_goals TEXT[],
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ User onboarding table created');
    
    // 11. Create user_sessions table for tracking time spent
    console.log('Creating user_sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        session_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        session_end TIMESTAMP,
        duration_seconds INTEGER,
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_type VARCHAR(50),
        browser VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ User sessions table created');
    
    // 12. Create feature_usage table for tracking feature engagement
    console.log('Creating feature_usage table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS feature_usage (
        usage_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        feature_name VARCHAR(100) NOT NULL,
        action_type VARCHAR(50),
        duration_seconds INTEGER,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Feature usage table created');
    
    // 13. Create subscription_history table for tracking plan changes
    console.log('Creating subscription_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_history (
        history_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        previous_plan VARCHAR(50),
        new_plan VARCHAR(50) NOT NULL,
        billing_cycle VARCHAR(20),
        amount_paid DECIMAL(10, 2),
        payment_method VARCHAR(50),
        stripe_subscription_id VARCHAR(255),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ends_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT subscription_plan_check CHECK (new_plan IN ('free', 'ifi_plus_monthly', 'ifi_plus_annual')),
        CONSTRAINT billing_cycle_check CHECK (billing_cycle IN ('monthly', 'annual', 'lifetime', NULL))
      );
    `);
    console.log('✓ Subscription history table created');
    
    // 14. Create user_analytics table for aggregated metrics
    console.log('Creating user_analytics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        analytics_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        total_sessions INTEGER DEFAULT 0,
        total_time_spent_seconds INTEGER DEFAULT 0,
        last_active TIMESTAMP,
        most_used_feature VARCHAR(100),
        ai_queries_count INTEGER DEFAULT 0,
        transactions_tracked INTEGER DEFAULT 0,
        accounts_connected INTEGER DEFAULT 0,
        goals_created INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ User analytics table created');
    
    // Create indexes for better performance
    console.log('\nCreating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_type);
      CREATE INDEX IF NOT EXISTS idx_session_user_id ON session_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_session_expires ON session_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_created ON ai_conversations(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON plaid_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON user_onboarding(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start DESC);
      CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature_name);
      CREATE INDEX IF NOT EXISTS idx_feature_usage_created ON feature_usage(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON subscription_history(status);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_last_active ON user_analytics(last_active DESC);
    `);
    console.log('✓ All indexes created');
    
    await client.query('COMMIT');
    
    console.log('\n✅ Database initialization complete!\n');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - session_tokens');
    console.log('  - password_reset_tokens');
    console.log('  - email_verification_tokens');
    console.log('  - audit_log');
    console.log('  - ai_conversations');
    console.log('  - plaid_items');
    console.log('  - accounts');
    console.log('  - transactions');
    console.log('  - user_onboarding');
    console.log('  - user_sessions');
    console.log('  - feature_usage');
    console.log('  - subscription_history');
    console.log('  - user_analytics\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Database initialization failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run initialization if executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database ready for use!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
