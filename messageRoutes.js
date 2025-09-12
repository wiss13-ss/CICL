const express = require('express');
const router = express.Router();
const db = require('./db');
const auth = require('./middleware/auth');

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user.id;

    // Get all conversations where the user is a participant
    const result = await db.query(
      `SELECT c.id, c.name, c.is_group, c.created_at, c.updated_at,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.id 
         AND m.read = false 
         AND m.sender_id != $1) as unread_count,
        (SELECT m.content FROM messages m 
         WHERE m.conversation_id = c.id 
         ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT m.created_at FROM messages m 
         WHERE m.conversation_id = c.id 
         ORDER BY m.created_at DESC LIMIT 1) as last_message_time
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1
      ORDER BY last_message_time DESC NULLS LAST`,
      [userId]
    );

    // For each conversation, get the participants
    const conversations = await Promise.all(
      result.rows.map(async (conversation) => {
        const participantsResult = await db.query(
          `SELECT u.id, u.username, u.first_name, u.last_name, u.email
          FROM users u
          JOIN conversation_participants cp ON u.id = cp.user_id
          WHERE cp.conversation_id = $1 AND u.id != $2`,
          [conversation.id, userId]
        );

        return {
          ...conversation,
          participants: participantsResult.rows,
          unread_count: parseInt(conversation.unread_count),
          // Format timestamps for client
          last_message_time: conversation.last_message_time ? 
            formatMessageTime(new Date(conversation.last_message_time)) : null
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error('Error getting conversations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is a participant in this conversation
    const participantCheck = await db.query(
      'SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    // Get messages for this conversation
    const result = await db.query(
      `SELECT m.*, u.first_name, u.last_name, u.username, u.email 
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    // Mark unread messages as read
    await db.query(
      `UPDATE messages 
       SET read = true
       WHERE conversation_id = $1 AND sender_id != $2 AND read = false`,
      [id, userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error getting messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message in a conversation
router.post('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, attachment_url } = req.body;
    const userId = req.user.id;

    // Verify user is a participant in this conversation
    const participantCheck = await db.query(
      'SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    // Insert the message
    const result = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content, attachment_url, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, userId, content, attachment_url]
    );

    // Update conversation's updated_at timestamp
    await db.query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    // Get sender information to return with the message
    const senderResult = await db.query(
      'SELECT first_name, last_name, username, email FROM users WHERE id = $1',
      [userId]
    );

    const message = {
      ...result.rows[0],
      first_name: senderResult.rows[0].first_name,
      last_name: senderResult.rows[0].last_name,
      username: senderResult.rows[0].username,
      email: senderResult.rows[0].email
    };

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { name, is_group, participant_ids } = req.body;
    const userId = req.user.id;

    // Make sure we have at least one other participant
    if (!participant_ids || participant_ids.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    // Start a transaction
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Create conversation
      const conversationResult = await client.query(
        `INSERT INTO conversations (name, is_group, created_at, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [name, is_group]
      );

      const conversationId = conversationResult.rows[0].id;

      // Add current user as participant
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         VALUES ($1, $2)`,
        [conversationId, userId]
      );

      // Add other participants
      for (const participantId of participant_ids) {
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id)
           VALUES ($1, $2)`,
          [conversationId, participantId]
        );
      }

      await client.query('COMMIT');

      res.status(201).json(conversationResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users for creating new conversations
router.get('/users', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, username, first_name, last_name, email
       FROM users
       WHERE id != $1
       ORDER BY first_name, last_name`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get participants for a specific conversation
router.get('/conversations/:id/participants', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is a participant in this conversation
    const participantCheck = await db.query(
      'SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    // Get all participants for this conversation
    const result = await db.query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.email
       FROM users u
       JOIN conversation_participants cp ON u.id = cp.user_id
       WHERE cp.conversation_id = $1 AND u.id != $2`,
      [id, userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error getting conversation participants:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Utility function to format message times for display
function formatMessageTime(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) {
    // Today: show time only
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date >= yesterday) {
    // Yesterday
    return 'Yesterday';
  } else {
    // Earlier: show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

module.exports = router; 