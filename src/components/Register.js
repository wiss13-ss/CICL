import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    // Add any additional fields you need
    role: 'user', // Default role
    phoneNumber: '',
    address: ''
  });
  const [formError, setFormError] = useState('');
  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const { firstName, middleName, lastName, email, password, role, phoneNumber, address } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    // Form validation
    if (!firstName || !lastName || !email || !password) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    // Register user
    const success = await register({ 
      firstName, 
      middleName, 
      lastName, 
      email, 
      password 
    });
    
    if (success) {
      // Redirect to landing page instead of dashboard
      navigate('/');
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Left section with registration form */}
      <div style={{ 
        width: '50%', 
        height: '100%',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
          <Link to="/" style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: '#3a4a6d',
            borderRadius: '5px',
            color: 'white',
            textDecoration: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            ←
          </Link>
        </div>
        
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: '400px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '30px',
            width: '100%'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              marginBottom: '30px',
              justifyContent: 'center',
              width: '100%'
            }}>
              <div style={{ textAlign: 'right', marginRight: '15px' }}>
                <div style={{ 
                  fontSize: '26px', 
                  fontWeight: 'bold', 
                  lineHeight: '1.2',
                  textTransform: 'uppercase',
                  color: '#2c3e50'
                }}>CICL:</div>
                <div style={{ 
                  fontSize: '26px', 
                  fontWeight: 'bold', 
                  lineHeight: '1.2',
                  textTransform: 'uppercase',
                  color: '#2c3e50'
                }}>PROGRESS</div>
                <div style={{ 
                  fontSize: '26px', 
                  fontWeight: 'bold', 
                  lineHeight: '1.2',
                  textTransform: 'uppercase',
                  color: '#2c3e50'
                }}>TRACKER</div>
              </div>
              <img 
                src="/images/progress-icon.png" 
                alt="Progress Icon" 
                style={{ width: '65px', height: '65px' }}
              />
            </div>
          </div>
          
          {(formError || error) && (
            <div style={{ 
              padding: '12px 15px', 
              backgroundColor: '#f8d7da', 
              color: '#721c24',
              borderRadius: '5px',
              marginBottom: '20px',
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {formError || error}
            </div>
          )}
          
          <form onSubmit={onSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={firstName}
                onChange={onChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '5px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                Middle Name
              </label>
              <input
                type="text"
                name="middleName"
                value={middleName}
                onChange={onChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '5px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={lastName}
                onChange={onChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '5px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '5px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '5px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
              />
            </div>
            
            <button 
              type="submit" 
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#3a4a6d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'background-color 0.15s ease-in-out'
              }}
            >
              Create Account
            </button>
            
            <div style={{ textAlign: 'center' }}>
              <Link 
                to="/login" 
                style={{ 
                  color: '#3a4a6d', 
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'color 0.15s ease-in-out'
                }}
              >
                Already have an account? Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right section with image */}
      <div style={{ 
        width: '50%', 
        height: '100%',
        backgroundImage: 'url(/images/children-background.png)', 
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      </div>
    </div>
  );
};

export default Register;