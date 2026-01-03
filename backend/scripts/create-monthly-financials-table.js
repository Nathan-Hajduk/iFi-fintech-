/**
 * Create user_monthly_financials table for storing historical adjustments
 */

const db = require('../config/database');

async function createMonthlyFinancialsTable() {
  try {
    console.log('Creating user_monthly_financials table...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_monthly_financials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
        year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
        income DECIMAL(12, 2) NOT NULL DEFAULT 0,
        expenses DECIMAL(12, 2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, month, year)
      )
    `);
    
    console.log('✅ Created user_monthly_financials table');
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_monthly_financials_user_date 
      ON user_monthly_financials(user_id, year DESC, month DESC)
    `);
    
    console.log('✅ Created index on user_monthly_financials');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    process.exit(1);
  }
}

createMonthlyFinancialsTable();
