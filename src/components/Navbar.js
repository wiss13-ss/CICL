import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const Navbar = () => {
  const { notifications, unreadCount } = useNotifications();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const location = useLocation();
  
  // Get recent notifications for the dropdown
  const recentNotifications = notifications
    .filter(notif => !notif.read)
    .slice(0, 3);

  // Close mobile navbar when route changes
  useEffect(() => {
    setIsNavCollapsed(true);
  }, [location.pathname]);

  // Format timestamp to relative time (e.g., "2 hours ago")
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <img 
            src="/logo192.png" 
            alt="Logo" 
            width="30" 
            height="30" 
            className="me-2" 
          />
          <span className="fw-bold text-primary">CICL Management</span>
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          aria-controls="navbarContent"
          aria-expanded={!isNavCollapsed ? true : false} 
          aria-label="Toggle navigation"
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarContent">
          {/* Main Navigation Links */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link 
                to="/dashboard" 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/cases" 
                className={`nav-link ${location.pathname.includes('/cases') ? 'active' : ''}`}
              >
                Case Management
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/programs" 
                className={`nav-link ${location.pathname === '/programs' ? 'active' : ''}`}
              >
                Programs
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/reports" 
                className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}
              >
                Reports
              </Link>
            </li>
          </ul>
          
          {/* Right Side Items */}
          <ul className="navbar-nav ms-auto">
            {/* Search */}
            <li className="nav-item d-none d-lg-block me-2">
              <form className="d-flex">
                <div className="input-group">
                  <input 
                    className="form-control border-end-0" 
                    type="search" 
                    placeholder="Search..." 
                    aria-label="Search"
                  />
                  <button className="btn btn-outline-secondary border-start-0" type="submit">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </form>
            </li>
            
            {/* Notifications */}
            <li className="nav-item dropdown">
              <a 
                className="nav-link position-relative p-2 mx-1" 
                href="#" 
                id="notificationsDropdown" 
                role="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <i className="fas fa-bell fs-5"></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unreadCount > 99 ? '99+' : unreadCount}
                    <span className="visually-hidden">unread notifications</span>
                  </span>
                )}
              </a>
              <div 
                className="dropdown-menu dropdown-menu-end shadow-sm p-0" 
                aria-labelledby="notificationsDropdown"
                style={{ minWidth: '320px', maxHeight: '400px', overflow: 'hidden' }}
              >
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <h6 className="m-0 fw-bold">Notifications</h6>
                  {unreadCount > 0 && (
                    <Link to="/notifications" className="text-decoration-none">
                      <small className="text-primary">Mark all as read</small>
                    </Link>
                  )}
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {recentNotifications.length > 0 ? (
                    <>
                      {recentNotifications.map(notification => (
                        <Link key={notification.id} to="/notifications" className="dropdown-item border-bottom p-3 text-decoration-none text-dark">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-medium">{notification.title}</span>
                            <small className="text-muted ms-2">{getRelativeTime(notification.timestamp)}</small>
                          </div>
                          <small className="text-muted">{notification.message.substring(0, 60)}{notification.message.length > 60 ? '...' : ''}</small>
                        </Link>
                      ))}
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <i className="fas fa-bell-slash text-muted mb-3 d-block" style={{ fontSize: '2rem' }}></i>
                      <p className="text-muted mb-0">No new notifications</p>
                    </div>
                  )}
                </div>
                <div className="border-top p-2 text-center">
                  <Link to="/notifications" className="btn btn-link text-decoration-none">View all notifications</Link>
                </div>
              </div>
            </li>
            
            {/* User Profile */}
            <li className="nav-item dropdown">
              <a 
                className="nav-link dropdown-toggle d-flex align-items-center" 
                href="#" 
                id="userDropdown" 
                role="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                  <span className="fw-bold">A</span>
                </div>
                <span className="d-none d-lg-inline">Admin User</span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="userDropdown">
                <li className="dropdown-header">
                  <div className="fw-bold">Admin User</div>
                  <small className="text-muted">Administrator</small>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="fas fa-user me-2 text-muted"></i>
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/settings">
                    <i className="fas fa-cog me-2 text-muted"></i>
                    Settings
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item text-danger" to="/logout">
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;