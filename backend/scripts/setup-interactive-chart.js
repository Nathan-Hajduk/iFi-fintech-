#!/usr/bin/env node

/**
 * Quick Setup Script for Interactive Chart Feature
 * Run this to set up the database table automatically
 */

const db = require('../config/database');

async function setupInteractiveChart() {
    console.log('🚀 Setting up Interactive Chart Feature...\n');
    
    try {
        // Create table
        console.log('📊 Creating user_monthly_financials table...');
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
        console.log('✅ Table created successfully\n');
        
        // Create index
        console.log('📑 Creating index for faster queries...');
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_monthly_financials_user_date 
            ON user_monthly_financials(user_id, year DESC, month DESC)
        `);
        console.log('✅ Index created successfully\n');
        
        // Verify table exists
        console.log('🔍 Verifying table structure...');
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_monthly_financials'
            ORDER BY ordinal_position
        `);
        
        console.log('✅ Table structure verified:');
        result.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
        
        console.log('\n🎉 Interactive Chart Feature setup complete!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Start the backend server: npm start');
        console.log('   2. Open the dashboard in your browser');
        console.log('   3. Click "Edit Data" on the Income vs Expenses chart');
        console.log('   4. Add monthly financial data and watch the chart update!');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.error('\n📋 Troubleshooting:');
        console.error('   1. Ensure PostgreSQL is running');
        console.error('   2. Check database credentials in config/database.js');
        console.error('   3. Verify the users table exists (user_id foreign key)');
        console.error('   4. Make sure you have CREATE TABLE permissions');
        process.exit(1);
    }
}

setupInteractiveChart();
