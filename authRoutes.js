const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const crypto = require('crypto');
const auth = require('./middleware/auth');

const router = express.Router();

// Add this new route for diagnostic purposes
router.get('/verify-token', auth, (req, res) => {
  // If this route is reached, the token is valid
  res.json({ 
    success: true, 
    message: 'Token is valid', 
    userId: req.user.id 
  });
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, middleName, lastName, role, phoneNumber, address } = req.body;
    
    // Check if user already exists
    const userCheck = await db.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ 
        message: 'User already exists with that email or username'  
      });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert the new user with only the columns that exist in the database
    // Remove the columns that don't exist in your actual database table
    const newUser = await db.query(
      'INSERT INTO users (username, email, password, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email',
      [username || email, email, hashedPassword, firstName, lastName]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { user: { id: newUser.rows[0].id } },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find the user
    const userResult = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Get user
    const userResult = await db.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [decoded.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a password reset token
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    // Store the token in the database
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [token, expires, email]
    );
    
    // In a real application, you would send an email with a link to reset the password
    // For development, just log the token
    console.log(`Password reset token for ${email}: ${token}`);
    
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a test user for chat functionality
router.post('/create-test-user', async (req, res) => {
  try {
    // Check if test user already exists
    const userCheck = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com']
    );
    
    if (userCheck.rows.length > 0) {
      // Return the existing test user
      const testUser = userCheck.rows[0];
      
      // Generate JWT token
      const token = jwt.sign(
        { user: { id: testUser.id } },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
      );
      
      return res.json({
        message: 'Test user already exists',
        token,
        user: {
          id: testUser.id,
          username: testUser.username,
          email: testUser.email
        }
      });
    }
    
    // Create a new test user if one doesn't exist
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    
    const newUser = await db.query(
      'INSERT INTO users (username, email, password, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email',
      ['testuser', 'test@example.com', hashedPassword, 'Test', 'User']
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { user: { id: newUser.rows[0].id } },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );
    
    res.status(201).json({
      message: 'Test user created successfully',
      token,
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email
      }
    });
  } catch (error) {
    console.error('Test user creation error:', error);
    res.status(500).json({ message: 'Server error during test user creation' });
  }
});

module.exports = router;