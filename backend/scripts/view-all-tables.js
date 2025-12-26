/**
 * View all PostgreSQL tables and their data
 * Shows table names, row counts, and sample data
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ifi_db',
  user: process.env.DB_USER || 'ifi_user',
  password: process.env.DB_PASSWORD,
});

async function viewAllTables() {
  const client = await pool.connect();
  
  try {
    console.log('\n='.repeat(80));
    console.log('📊 iFi PostgreSQL Database Overview');
    console.log('='.repeat(80));
    console.log(`Database: ${process.env.DB_NAME || 'ifi_db'}`);
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    console.log(`User: ${process.env.DB_USER || 'ifi_user'}`);
    console.log('='.repeat(80));
    
    // Get all table names
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log(`\n📋 Total Tables: ${tablesResult.rows.length}\n`);
    
    // For each table, get row count and structure
    for (const { tablename } of tablesResult.rows) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📁 TABLE: ${tablename}`);
      console.log('─'.repeat(80));
      
      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) FROM ${tablename}`);
      const rowCount = countResult.rows[0].count;
      console.log(`📊 Rows: ${rowCount}`);
      
      // Get column information
      const columnsResult = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tablename]);
      
      console.log(`\n📝 Columns (${columnsResult.rows.length}):`);
      columnsResult.rows.forEach(col => {
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`   • ${col.column_name.padEnd(30)} ${col.data_type}${length} ${nullable}`);
      });
      
      // Show sample data if table has rows
      if (parseInt(rowCount) > 0) {
        console.log(`\n📄 Sample Data (first 3 rows):`);
        const sampleResult = await client.query(`
          SELECT * FROM ${tablename} LIMIT 3
        `);
        
        if (sampleResult.rows.length > 0) {
          // Show limited columns to avoid overwhelming output
          const firstRow = sampleResult.rows[0];
          const columns = Object.keys(firstRow).slice(0, 8); // Show first 8 columns
          
          sampleResult.rows.forEach((row, index) => {
            console.log(`\n   Row ${index + 1}:`);
            columns.forEach(col => {
              let value = row[col];
              
              // Format long values
              if (typeof value === 'string' && value.length > 50) {
                value = value.substring(0, 47) + '...';
              } else if (typeof value === 'object') {
                value = JSON.stringify(value).substring(0, 47) + '...';
              } else if (value === null) {
                value = 'NULL';
              }
              
              console.log(`      ${col.padEnd(25)}: ${value}`);
            });
          });
          
          if (Object.keys(firstRow).length > 8) {
            console.log(`\n   ... (${Object.keys(firstRow).length - 8} more columns hidden)`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Database overview complete');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error viewing tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  viewAllTables()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { viewAllTables };
