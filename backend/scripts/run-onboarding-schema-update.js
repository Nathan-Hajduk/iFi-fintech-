/**
 * Update user_onboarding table schema
 * Adds all the comprehensive onboarding fields
 */

require('dotenv').config();
const db = require('../config/database');

async function updateOnboardingSchema() {
  const client = await db.getClient();
  
  try {
    console.log('🔄 Updating user_onboarding table schema...\n');
    
    // Add new columns
    console.log('Adding new columns...');
    await client.query(`
      ALTER TABLE user_onboarding
      ADD COLUMN IF NOT EXISTS purpose VARCHAR(50),
      ADD COLUMN IF NOT EXISTS income_source VARCHAR(100),
      ADD COLUMN IF NOT EXISTS monthly_takehome DECIMAL(15, 2),
      ADD COLUMN IF NOT EXISTS additional_income JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS expenses JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS expense_categories JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS subscriptions JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS total_assets_value DECIMAL(15, 2),
      ADD COLUMN IF NOT EXISTS investments JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS portfolio_value DECIMAL(15, 2),
      ADD COLUMN IF NOT EXISTS debts JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS total_debt_amount DECIMAL(15, 2),
      ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50),
      ADD COLUMN IF NOT EXISTS step4_responses JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS bank_connected BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS plaid_item_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS linked_accounts JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('✅ New columns added');
    
    // Also change financial_goals from TEXT[] to TEXT for compatibility
    console.log('\nUpdating financial_goals column type...');
    await client.query(`
      ALTER TABLE user_onboarding 
      ALTER COLUMN financial_goals TYPE TEXT;
    `);
    console.log('✅ financial_goals column updated to TEXT');
    
    // Create indexes
    console.log('\nCreating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_onboarding_purpose ON user_onboarding(purpose);
      CREATE INDEX IF NOT EXISTS idx_user_onboarding_plan ON user_onboarding(selected_plan);
      CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(completed_at);
    `);
    console.log('✅ Indexes created');
    
    // Verify the schema
    console.log('\n📋 Verifying schema...');
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_onboarding' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n✅ user_onboarding table schema:');
    console.table(result.rows);
    
    console.log('\n🎉 Schema update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

updateOnboardingSchema();
