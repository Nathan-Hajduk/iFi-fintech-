/**
 * Payment Tables Migration Script
 * Creates payment_transactions table and adds subscription fields to users table
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('Starting payment tables migration...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'create-payment-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    await db.query(sql);
    
    console.log('✅ Payment tables migration completed successfully!');
    console.log('\nCreated:');
    console.log('  - payment_transactions table');
    console.log('  - Added subscription fields to users table');
    console.log('  - Created performance indexes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
