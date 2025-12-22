#!/usr/bin/env node

/**
 * iFi Backend - Setup Script
 * Interactive setup wizard for configuring the backend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('\n🚀 iFi Backend Setup Wizard\n');
console.log('This script will help you set up the iFi backend.\n');

// Check if Node.js version is adequate
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion < 18) {
  console.error('❌ Error: Node.js version 18 or higher is required');
  console.error(`   Current version: ${nodeVersion}`);
  console.error('   Please upgrade Node.js: https://nodejs.org/');
  process.exit(1);
}

console.log('✓ Node.js version check passed');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('\n⚠️  .env file already exists');
  console.log('   If you want to reconfigure, delete .env and run this script again');
} else {
  console.log('\n📝 Creating .env file from template...');
  
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ Error: .env.example not found');
    process.exit(1);
  }
  
  // Read .env.example
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Generate secure encryption key
  const encryptionKey = crypto.randomBytes(32).toString('hex');
  console.log('   Generated encryption key');
  
  // Generate JWT secret
  const jwtSecret = crypto.randomBytes(32).toString('base64');
  console.log('   Generated JWT secret');
  
  // Generate session secret
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  console.log('   Generated session secret');
  
  // Replace placeholders
  envContent = envContent.replace('your_32_byte_encryption_key_here_64_chars', encryptionKey);
  envContent = envContent.replace('your_jwt_secret_here', jwtSecret);
  envContent = envContent.replace('your_session_secret_here', sessionSecret);
  
  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✓ .env file created');
  
  console.log('\n⚠️  IMPORTANT: Configure the following in your .env file:');
  console.log('   1. PLAID_CLIENT_ID (get from https://dashboard.plaid.com/)');
  console.log('   2. PLAID_SECRET (get from https://dashboard.plaid.com/)');
  console.log('   3. DB_PASSWORD (your PostgreSQL password)');
  console.log('   4. Other database settings if different from defaults');
}

// Check if node_modules exists
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('\n📦 Installing dependencies...');
  console.log('   This may take a few minutes...\n');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n✓ Dependencies installed');
  } catch (error) {
    console.error('\n❌ Failed to install dependencies');
    console.error('   Please run "npm install" manually');
    process.exit(1);
  }
} else {
  console.log('\n✓ Dependencies already installed');
}

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
  console.log('✓ Created logs directory');
}

console.log('\n✅ Setup complete!\n');
console.log('Next steps:');
console.log('   1. Configure your .env file with Plaid credentials');
console.log('   2. Ensure PostgreSQL is running');
console.log('   3. Create database: createdb ifi_db');
console.log('   4. Start the server: npm start');
console.log('\nFor development with auto-reload:');
console.log('   npm run dev\n');
console.log('📚 Documentation: See PLAID_INTEGRATION_GUIDE.md\n');
