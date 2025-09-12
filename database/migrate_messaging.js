const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create a new database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'auth_system',
  password: process.env.DB_PASSWORD || 'olddine15',
  port: process.env.DB_PORT || 5432,
});

// SQL for creating messaging tables
const messagingSchema = `
-- Add tables for messaging system
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  is_group BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
`;

async function runMigration() {
  try {
    console.log('Running messaging schema migration...');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(messagingSchema);
      await client.query('COMMIT');
      console.log('Migration completed successfully.');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Migration failed:', err);
      throw err;
    } finally {
      client.release();
    }
    
    pool.end();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

runMigration(); 