const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('./config');
const db = require('./db');

// Track active connections
const clients = new Map();
// In-memory fallback for testing without database
const inMemoryStore = {
  participants: new Map(),
  conversations: new Map(),
  messages: []
};

// Initialize WebSocket server
function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
  });

  // Handle new connections
  wss.on('connection', async (ws, req) => {
    // Extract JWT token from URL
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    
    console.log('WebSocket connection attempt - Token present:', !!token);
    
    // Validate token and get user
    let userId;
    try {
      if (!token) {
        console.log('WebSocket authentication failed: No token provided');
        ws.close(4001, 'Authentication required');
        return;
      }
      
      // Debug token format first
      const debugResult = config.debugToken(token);
      if (!debugResult || !debugResult.user || !debugResult.user.id) {
        console.log('Token format is invalid or missing user data');
        ws.close(4003, 'Invalid token format');
        return;
      }
      
      const decoded = jwt.verify(token, config.jwtSecret);
      userId = decoded.user.id;
      
      // Add client to the map with their user ID
      clients.set(userId, ws);
      
      // Send welcome message
      sendToClient(ws, {
        type: 'connection_established',
        payload: {
          message: 'Connected to chat server',
          user_id: userId
        }
      });
      
      console.log(`User ${userId} connected to WebSocket successfully`);
    } catch (err) {
      console.error('WebSocket auth error:', err.message);
      ws.close(4002, `Invalid authentication: ${err.message}`);
      return;
    }
    
    // Handle messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        // Handle message types
        switch (data.type) {
          case 'send_message':
            await handleSendMessage(userId, data.payload);
            break;
            
          case 'mark_read':
            await handleMarkRead(userId, data.payload);
            break;
            
          default:
            console.log(`Unknown message type: ${data.type}`);
        }
      } catch (err) {
        console.error('Error processing message:', err);
        sendToClient(ws, {
          type: 'error',
          payload: {
            message: 'Error processing your request'
          }
        });
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      clients.delete(userId);
      console.log(`User ${userId} disconnected from WebSocket`);
    });
  });
  
  return wss;
}

// Send message to a specific client
function sendToClient(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// Send message to specific user by ID
function sendToUser(userId, data) {
  const ws = clients.get(userId);
  if (ws) {
    sendToClient(ws, data);
  }
}

// Broadcast to all participants in a conversation except sender
async function broadcastToConversation(conversationId, senderId, data) {
  try {
    // Get all participants in the conversation
    let participants;
    try {
      participants = await db.query('SELECT user_id FROM conversation_participants WHERE conversation_id = $1', [conversationId]);
    } catch (dbErr) {
      console.log('Using in-memory storage fallback');
      const participantsList = inMemoryStore.participants.get(conversationId) || [];
      participants = { rows: participantsList.map(id => ({ user_id: id })) };
    };
    
    // Send to each participant except the sender
    participants.rows.forEach(participant => {
      if (participant.user_id !== senderId) {
        sendToUser(participant.user_id, data);
      }
    });
  } catch (err) {
    console.error('Error broadcasting to conversation:', err);
  }
}

// Handle sending a new message
async function handleSendMessage(userId, payload) {
  try {
    const { conversation_id, content, attachment_url } = payload;
    
    // Verify user is in the conversation
    const participant = await db.query(
      'SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversation_id, userId]
    );
    
    if (participant.rows.length === 0) {
      return sendToUser(userId, {
        type: 'error',
        payload: {
          message: 'You are not a participant in this conversation'
        }
      });
    }
    
    // Save message to database
    const result = await db.query(
      `INSERT INTO messages 
        (conversation_id, sender_id, content, attachment_url) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [conversation_id, userId, content, attachment_url]
    );
    
    const message = result.rows[0];
    
    // Get sender details
    const userResult = await db.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [userId]
    );
    
    const { first_name, last_name } = userResult.rows[0];
    
    // Prepare full message object with sender details
    const fullMessage = {
      ...message,
      first_name,
      last_name
    };
    
    // Send confirmation to sender
    sendToUser(userId, {
      type: 'message_sent',
      payload: fullMessage
    });
    
    // Broadcast to other participants
    broadcastToConversation(conversation_id, userId, {
      type: 'new_message',
      payload: fullMessage
    });
    
    // Update conversation last_message
    await db.query(
      `UPDATE conversations 
       SET last_message = $1, last_message_time = NOW() 
       WHERE id = $2`,
      [content, conversation_id]
    );
    
    // Add unread counts for other participants
    await db.query(
      `INSERT INTO unread_messages (conversation_id, user_id, count)
       SELECT $1, user_id, 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id != $2
       ON CONFLICT (conversation_id, user_id)
       DO UPDATE SET count = unread_messages.count + 1`,
      [conversation_id, userId]
    );
    
  } catch (err) {
    console.error('Error handling send message:', err);
    sendToUser(userId, {
      type: 'error',
      payload: {
        message: 'Error sending message'
      }
    });
  }
}

// Handle marking messages as read
async function handleMarkRead(userId, payload) {
  try {
    const { conversation_id } = payload;
    
    // Reset unread count
    await db.query(
      `UPDATE unread_messages
       SET count = 0
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversation_id, userId]
    );
    
    // Send confirmation
    sendToUser(userId, {
      type: 'messages_marked_read',
      payload: {
        conversation_id
      }
    });
    
  } catch (err) {
    console.error('Error marking messages as read:', err);
  }
}

module.exports = {
  initWebSocketServer,
  sendToUser,
  broadcastToConversation
}; 