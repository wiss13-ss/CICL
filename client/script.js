document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const tabHeaders = document.querySelectorAll('.tab-header div');
  const tabBodies = document.querySelectorAll('.tab-body');
  
  tabHeaders.forEach(header => {
    header.addEventListener('click', function() {
      // Remove active class from all headers and bodies
      tabHeaders.forEach(h => h.classList.remove('active'));
      tabBodies.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked header
      this.classList.add('active');
      
      // Add active class to corresponding body
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Form submission handlers
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginMessage = document.getElementById('login-message');
  const signupMessage = document.getElementById('signup-message');
  
  // Login form submission
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Login successful
        loginMessage.textContent = data.message;
        loginMessage.className = 'message success';
        
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard or home page after successful login
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1500);
      } else {
        // Login failed
        loginMessage.textContent = data.message;
        loginMessage.className = 'message error';
      }
    } catch (error) {
      console.error('Login error:', error);
      loginMessage.textContent = 'An error occurred during login. Please try again.';
      loginMessage.className = 'message error';
    }
  });
  
  // Signup form submission
  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    // Check if passwords match
    if (password !== confirmPassword) {
      signupMessage.textContent = 'Passwords do not match';
      signupMessage.className = 'message error';
      return;
    }
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Signup successful
        signupMessage.textContent = data.message;
        signupMessage.className = 'message success';
        
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard or home page after successful signup
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1500);
      } else {
        // Signup failed
        signupMessage.textContent = data.message;
        signupMessage.className = 'message error';
      }
    } catch (error) {
      console.error('Signup error:', error);
      signupMessage.textContent = 'An error occurred during signup. Please try again.';
      signupMessage.className = 'message error';
    }
  });
});