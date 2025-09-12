import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import Settings from './components/Settings';
import Program from './components/Program';
import Messages from './components/Messages';
import Notifications from './components/Notifications';
import Reports from './components/Reports';
import ForgotPassword from './components/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';
import CaseManagement from './components/CaseManagement';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Add axios request interceptor to include token with every request
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

function App() {
  // Add useEffect to check if server is up and token is valid
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Check if server is running
        await axios.get('http://localhost:5000/');
        console.log('Server is up and running');
        
        // If we have a token, check if it's valid
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await axios.get('http://localhost:5000/api/auth/verify-token');
            console.log('Token verified successfully');
          } catch (err) {
            console.error('Token verification failed:', err.response?.status, err.response?.data);
          }
        }
      } catch (err) {
        console.error('Server connection failed:', err.message);
      }
    };
    
    checkServerStatus();
  }, []);

  return (
    <AuthProvider>
      <CaseProvider>
        <NotificationProvider>
          <MessageProvider>
            <Router>
              <Routes>
                {/* Public routes with centered container */}
                <Route path="/" element={<div className="app-container"><LandingPage /></div>} />
                <Route path="/register" element={<div className="app-container"><Register /></div>} />
                <Route path="/login" element={<div className="app-container"><Login /></div>} />
                <Route path="/forgot-password" element={<div className="app-container"><ForgotPassword /></div>} />
                
                {/* Protected routes with full-width layout */}
                <Route 
                  path="/dashboard" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/program" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Program />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/messages" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Messages />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Notifications />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Reports />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/cases" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CaseManagement />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
              </Routes>
            </Router>
          </MessageProvider>
        </NotificationProvider>
      </CaseProvider>
    </AuthProvider>
  );
}

export default App;
