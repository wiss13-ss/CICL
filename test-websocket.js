const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('./config');

console.log('🧪 WebSocket Authentication Test Client');
console.log('======================================');

// Create a test user for token generation
const testUser = {
  id: '12345',
  name: 'Test User',
  email: 'test@example.com'
};

// Generate a token
const token = jwt.sign({ user: testUser }, config.jwtSecret, { expiresIn: '1h' });
console.log('✅ Generated test token');
console.log('Token debug info:');
config.debugToken(token);

// Connect to WebSocket server
const wsUrl = `ws://localhost:${config.server.port}/ws?token=${token}`;
console.log(`\n🔌 Connecting to: ${wsUrl}`);

const ws = new WebSocket(wsUrl);

// Handle connection open
ws.on('open', () => {
  console.log('✅ Connection established');
  
  // Send a test message
  const testMessage = {
    type: 'test_message',
    payload: {
      message: 'Test message from client'
    }
  };
  
  ws.send(JSON.stringify(testMessage));
  console.log('📤 Sent test message');
});

// Handle messages
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📥 Received message:', message);
    
    if (message.type === 'connection_established') {
      console.log('✅ Authentication successful');
      
      // Close connection after 2 seconds
      setTimeout(() => {
        console.log('👋 Closing connection');
        ws.close();
        process.exit(0);
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error);
  }
});

// Handle errors
ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

// Handle close
ws.on('close', (code, reason) => {
  console.log(`🔒 Connection closed. Code: ${code}, Reason: ${reason}`);
  process.exit(0);
}); 