/**
 * Database Migration: AI Conversation History
 * Creates tables for storing iFi AI chat conversations
 */

const db = require('../config/database');

async function migrate() {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log('Starting AI conversations migration...');
    
    // Create ai_conversations table
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
    console.log('✓ Created ai_conversations table');
    
    // Create index on user_id for fast lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id 
      ON ai_conversations(user_id);
    `);
    console.log('✓ Created index on user_id');
    
    // Create index on created_at for chronological sorting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at 
      ON ai_conversations(created_at DESC);
    `);
    console.log('✓ Created index on created_at');
    
    // Create composite index for user conversations
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_created 
      ON ai_conversations(user_id, created_at DESC);
    `);
    console.log('✓ Created composite index');
    
    await client.query('COMMIT');
    console.log('\n✅ AI conversations migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration finished. Exiting...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { migrate };
