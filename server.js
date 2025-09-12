const express = require('express');
const cors = require('cors');
const http = require('http');
const authRoutes = require('./authRoutes');
const caseRoutes = require('./caseRoutes');
const messageRoutes = require('./messageRoutes');
const db = require('./db');
const socket = require('./socket');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Improved CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for development - restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/cases', caseRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Verify database connection
db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows[0]);
  }
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = socket.initWebSocketServer(server);

// Start server
server.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`WebSocket Server initialized`);
});