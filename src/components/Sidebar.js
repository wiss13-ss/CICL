import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaBell } from 'react-icons/fa';

const Sidebar = () => {
  const { logout, user, userProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  // Initialize with empty notifications
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  // Clear all alerts
  const clearAlerts = () => {
    setAlerts([]);
    setShowNotifications(false);
  };

  // Mark a specific alert as read
  const markAsRead = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? {...alert, read: true} : alert
    ));
  };

  // Handle notification click based on type
  const handleNotificationClick = (alert) => {
    markAsRead(alert.id);
    
    // Navigate to appropriate section based on notification type
    switch(alert.type) {
      case 'activity':
        navigate('/program');
        break;
      case 'deadline':
      case 'critical':
        navigate('/cases');
        break;
      default:
        navigate('/dashboard');
    }
    
    setShowNotifications(false);
  };

  // Count unread notifications
  const unreadCount = alerts.filter(alert => !alert.read).length;

  // Add this for debugging
  useEffect(() => {
    console.log("Current user data:", user);
    console.log("Current user profile:", userProfile);
  }, [user, userProfile]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  // Common styles for sidebar items
  const iconStyle = {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    fontSize: '1.25rem',
    marginBottom: '0.25rem'
  };
  
  const labelStyle = {
    width: '100%',
    textAlign: 'center',
    fontSize: '0.75rem'
  };
  
  const navLinkStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.75rem 0',
    width: '100%'
  };

  return (
    <nav className="sidebar d-flex flex-column flex-shrink-0 text-white" style={{ width: '84px', minHeight: '100vh', backgroundColor: '#5470B0' }}>
      {/* Profile Section */}
      <div className="sidebar-header p-3 d-flex justify-content-center">
        <div className="user-avatar bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
          {userProfile && userProfile.profileImage ? (
            <img 
              src={userProfile.profileImage} 
              alt="Profile" 
              className="rounded-circle" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <i className="fas fa-user text-primary"></i>
          )}
        </div>
      </div>
      
      {/* User Info */}
      <div className="d-flex flex-column align-items-center px-2 mb-3">
        <div className="fw-medium text-center w-100">{userProfile ? userProfile.firstName : (user ? user.name?.split(' ')[0] : 'Junjun')}</div>
        <div className="opacity-75 text-center w-100 mb-2">{user ? user.role : 'CICL Officer'}</div>
        
        {/* Notification bell */}
        <div className="position-relative mt-2" style={{ height: '24px' }}>
          <button 
            className="btn btn-link text-white p-0" 
            onClick={toggleNotifications}
            style={{ background: 'none', border: 'none' }}
          >
            <FaBell size={20} className={unreadCount > 0 ? "animate__animated animate__heartBeat animate__infinite" : ""} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Notification panel */}
      {showNotifications && (
        <div className="notification-panel bg-white text-dark p-3 position-fixed" 
             style={{ 
               left: '84px', 
               top: '0', 
               width: '320px', 
               zIndex: 1050,
               boxShadow: '0 0 10px rgba(0,0,0,0.1)',
               borderRadius: '0 8px 8px 0',
               maxHeight: '80vh',
               overflowY: 'auto'
             }}>
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
            <h6 className="m-0">Notifications</h6>
            <button 
              className="btn-close text-reset" 
              onClick={() => setShowNotifications(false)}
              aria-label="Close"
            ></button>
          </div>
          
          {alerts.length > 0 ? (
            <>
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`alert-item p-2 mb-2 rounded ${alert.read ? 'bg-light' : 'bg-info bg-opacity-10'}`}
                  style={{ 
                    cursor: 'pointer', 
                    borderLeft: `4px solid ${
                      alert.type === 'critical' ? '#dc3545' : 
                      alert.type === 'deadline' ? '#fd7e14' : '#0d6efd'
                    }`
                  }}
                  onClick={() => handleNotificationClick(alert)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <span className={`${!alert.read ? 'fw-bold' : ''}`}>{alert.message}</span>
                    {!alert.read && <span className="badge bg-primary rounded-pill ms-1">New</span>}
                  </div>
                  <small className="text-muted d-block mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </small>
                </div>
              ))}
              <div className="text-center mt-3">
                <button className="btn btn-sm btn-outline-secondary" onClick={clearAlerts}>
                  Clear All
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-bell-slash text-muted mb-3" style={{ fontSize: '2rem' }}></i>
              <p className="mb-0">No notifications</p>
              <small className="text-muted">You'll see notifications about cases and activities here</small>
            </div>
          )}
        </div>
      )}
      
      {/* Navigation */}
      <ul className="nav flex-column mb-auto p-0 mt-2 w-100">
        <li className="w-100 mb-3 text-center">
          <Link to="/dashboard" className="nav-link text-white" style={navLinkStyle}>
            <div style={iconStyle}>
              <i className="fas fa-home"></i>
            </div>
            <div style={labelStyle}>Home</div>
          </Link>
        </li>
        <li className="w-100 mb-3 text-center">
          <Link to="/cases" className="nav-link text-white" style={navLinkStyle}>
            <div style={iconStyle}>
              <i className="fas fa-briefcase"></i>
            </div>
            <div style={labelStyle}>Cases</div>
          </Link>
        </li>
        <li className="w-100 mb-3 text-center">
          <Link to="/program" className="nav-link text-white" style={navLinkStyle}>
            <div style={iconStyle}>
              <i className="fas fa-broadcast-tower"></i>
            </div>
            <div style={labelStyle}>Program</div>
          </Link>
        </li>
        <li className="w-100 mb-3 text-center">
          <Link to="/messages" className="nav-link text-white" style={navLinkStyle}>
            <div style={iconStyle}>
              <i className="fas fa-envelope"></i>
            </div>
            <div style={labelStyle}>Messages</div>
          </Link>
        </li>
        <li className="w-100 mb-3 text-center">
          <Link to="/reports" className="nav-link text-white" style={navLinkStyle}>
            <div style={iconStyle}>
              <i className="fas fa-file-alt"></i>
            </div>
            <div style={labelStyle}>Report</div>
          </Link>
        </li>
        <li className="w-100 text-center mt-auto">
          <Link to="/settings" className="nav-link text-white" style={navLinkStyle}>
            <div style={iconStyle}>
              <i className="fas fa-cog"></i>
            </div>
            <div style={labelStyle}>Settings</div>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;