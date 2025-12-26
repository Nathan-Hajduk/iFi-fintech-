/**
 * Create Test User Script
 * Creates a test user account for development/testing
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ifi_db',
  user: process.env.DB_USER || 'ifi_user',
  password: process.env.DB_PASSWORD,
});

async function createTestUser() {
  const client = await pool.connect();
  
  try {
    console.log('Creating test user account...\n');
    
    // Test user credentials
    const testUser = {
      email: 'test@ifi.com',
      username: 'testuser',
      password: 'Test1234!',
      firstName: 'Test',
      lastName: 'User',
      subscriptionType: 'ifi_plus' // Give them premium access for testing
    };
    
    // Hash password
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT email FROM users WHERE email = $1 OR username = $2',
      [testUser.email, testUser.username]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Test user already exists');
      console.log('\nLogin credentials:');
      console.log('  Email: test@ifi.com');
      console.log('  Username: testuser');
      console.log('  Password: Test1234!');
      console.log('  Access Level: iFi+ (Premium)\n');
      return;
    }
    
    // Create user
    await client.query(`
      INSERT INTO users (
        email, 
        username, 
        password, 
        first_name, 
        last_name, 
        subscription_type, 
        role,
        email_verified,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE)
    `, [
      testUser.email,
      testUser.username,
      hashedPassword,
      testUser.firstName,
      testUser.lastName,
      testUser.subscriptionType,
      testUser.subscriptionType
    ]);
    
    console.log('✅ Test user created successfully!\n');
    console.log('Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Email:    test@ifi.com');
    console.log('  Username: testuser');
    console.log('  Password: Test1234!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Access Level: iFi+ (Premium)');
    console.log('  Status: Email Verified ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('You can now log in at: http://localhost:3000\n');
    
    // Also create a free user for testing
    const freeUser = {
      email: 'free@ifi.com',
      username: 'freeuser',
      password: 'Free1234!',
      firstName: 'Free',
      lastName: 'User',
      subscriptionType: 'free'
    };
    
    const freeUserExists = await client.query(
      'SELECT email FROM users WHERE email = $1',
      [freeUser.email]
    );
    
    if (freeUserExists.rows.length === 0) {
      const freeHashedPassword = await bcrypt.hash(freeUser.password, 12);
      
      await client.query(`
        INSERT INTO users (
          email, 
          username, 
          password, 
          first_name, 
          last_name, 
          subscription_type, 
          role,
          email_verified,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE)
      `, [
        freeUser.email,
        freeUser.username,
        freeHashedPassword,
        freeUser.firstName,
        freeUser.lastName,
        freeUser.subscriptionType,
        freeUser.subscriptionType
      ]);
      
      console.log('✅ Free test user also created!\n');
      console.log('Free User Login:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Email:    free@ifi.com');
      console.log('  Username: freeuser');
      console.log('  Password: Free1234!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Access Level: Free');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    console.error('\nMake sure:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. Database is initialized (run: node scripts/init-database.js)');
    console.error('  3. .env file has correct database credentials');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  createTestUser()
    .then(() => {
      console.log('Ready to test! 🚀');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createTestUser };
