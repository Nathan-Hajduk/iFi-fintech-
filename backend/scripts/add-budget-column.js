// Add budget column to user_onboarding table
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function addBudgetColumn() {
    try {
        console.log('🔧 Adding budget column to user_onboarding table...');
        
        const sqlPath = path.join(__dirname, 'add-budget-column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await db.query(sql);
        
        console.log('✅ Budget column added successfully!');
        console.log('📊 Users can now save budget data during onboarding');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding budget column:', error);
        process.exit(1);
    }
}

addBudgetColumn();
