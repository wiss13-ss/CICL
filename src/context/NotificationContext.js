import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCases } from './CaseContext';

// Create the context
const NotificationContext = createContext();

// Create a custom hook to use the context
export const useNotifications = () => useContext(NotificationContext);

// Provider component
export const NotificationProvider = ({ children }) => {
  const { cases } = useCases();
  const [notifications, setNotifications] = useState([]);
  const [lastChecked, setLastChecked] = useState(Date.now());
  const [processedCaseIds, setProcessedCaseIds] = useState(new Set());
  
  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('caseNotifications');
    if (savedNotifications) {
      try {
        // Parse the notifications and convert string timestamps back to Date objects
        const parsedNotifications = JSON.parse(savedNotifications);
        
        // Convert timestamp strings to Date objects
        parsedNotifications.forEach(notification => {
          notification.timestamp = new Date(notification.timestamp);
        });
        
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
        setNotifications([]);
      }
    }
    
    // Get the last checked time
    const savedLastChecked = localStorage.getItem('lastNotificationCheck');
    if (savedLastChecked) {
      setLastChecked(parseInt(savedLastChecked, 10));
    }
    
    // Load processed case IDs from localStorage
    const savedProcessedCaseIds = localStorage.getItem('processedCaseIds');
    if (savedProcessedCaseIds) {
      try {
        setProcessedCaseIds(new Set(JSON.parse(savedProcessedCaseIds)));
      } catch (error) {
        console.error('Error parsing processed case IDs:', error);
        setProcessedCaseIds(new Set());
      }
    }
  }, []);
  
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('caseNotifications', JSON.stringify(notifications));
  }, [notifications]);
  
  // Save processed case IDs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('processedCaseIds', JSON.stringify([...processedCaseIds]));
  }, [processedCaseIds]);
  
  // Check for new notifications when cases change
  useEffect(() => {
    if (!cases || cases.length === 0) return;
    
    const now = Date.now();
    let newNotifications = [];
    const existingIds = new Set(notifications.map(n => n.id));
    const updatedProcessedIds = new Set(processedCaseIds);
    let processedIdsChanged = false;
    
    // Check for new cases and new admissions
    cases.forEach(caseItem => {
      if (!caseItem || !caseItem.id) return;
      
      // Check for brand new cases that we haven't processed yet
      if (!processedCaseIds.has(caseItem.id)) {
        // This is a new case we haven't seen before
        const newCaseNotificationId = `new-case-${caseItem.id}`;
        
        if (!existingIds.has(newCaseNotificationId)) {
          console.log(`Creating notification for new case: ${caseItem.name}`);
          newNotifications.push({
            id: newCaseNotificationId,
            title: 'New Case Added',
            message: `A new case was created for ${caseItem.name}`,
            timestamp: new Date(),
            type: 'new-case',
            read: false,
            iconType: 'case',
            color: '#4CAF50', // Green
            caseId: caseItem.id
          });
        }
        
        // Also create an admission notification
        const admissionNotificationId = `new-admission-${caseItem.id}`;
        if (!existingIds.has(admissionNotificationId) && 
            (String(caseItem?.status || '').toLowerCase() === 'active' || 
             caseItem?.status === true ||
             caseItem?.isActive === true || 
             caseItem?.status === null || 
             caseItem?.status === undefined)) {
          
          console.log(`Creating admission notification for: ${caseItem.name}`);
          newNotifications.push({
            id: admissionNotificationId,
            title: 'New Admission',
            message: `${caseItem.name} has been admitted as a new case`,
            timestamp: new Date(),
            type: 'admission',
            read: false,
            iconType: 'new',
            color: '#9C27B0', // Purple
            caseId: caseItem.id
          });
        }
        
        // Mark this case ID as processed
        updatedProcessedIds.add(caseItem.id);
        processedIdsChanged = true;
      }
      
      // Check for reintegrations (regardless of whether it's a new case)
      const reintegrationKey = `reintegration-${caseItem.id}`;
      if (caseItem?.status?.toLowerCase() === 'reintegrate' && !existingIds.has(reintegrationKey)) {
        console.log(`Creating reintegration notification for: ${caseItem.name}`);
        newNotifications.push({
          id: reintegrationKey,
          title: 'Reintegration',
          message: `${caseItem.name}'s case has been marked for reintegration`,
          timestamp: new Date(),
          type: 'reintegration',
          read: false,
          iconType: 'update',
          color: '#2196F3', // Blue
          caseId: caseItem.id
        });
      }
      
      // Skip the rest of the checks for lastUpdated since we're using the ID-based approach now
    });
    
    // Generate follow-up reminders based on case age
    cases.forEach(caseItem => {
      if (caseItem?.lastUpdated) {
        const updateDate = new Date(caseItem.lastUpdated);
        const daysSinceUpdate = Math.floor((now - updateDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Cases not updated in 30 days need follow-up
        if (daysSinceUpdate >= 30) {
          const notificationId = `followup-${caseItem.id}`;
          
          // Only add if this notification doesn't already exist
          if (!existingIds.has(notificationId)) {
            newNotifications.push({
              id: notificationId,
              title: 'Follow-up Reminder',
              message: `Follow-up required for ${caseItem.name}'s case - no updates in ${daysSinceUpdate} days`,
              timestamp: new Date(),
              type: 'reminder',
              read: false,
              iconType: 'warning',
              color: '#FF9800', // Orange
              caseId: caseItem.id
            });
          }
        }
      }
    });
    
    // Only add new notifications if there are any
    if (newNotifications.length > 0) {
      console.log(`Adding ${newNotifications.length} new notifications`);
      setNotifications(prev => [...newNotifications, ...prev]);
    }
    
    // Update processed IDs if changed
    if (processedIdsChanged) {
      setProcessedCaseIds(updatedProcessedIds);
    }
    
    // Update last checked time
    setLastChecked(now);
    localStorage.setItem('lastNotificationCheck', now.toString());
  }, [cases, notifications, processedCaseIds]);
  
  // Method to mark a notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Method to mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Method to add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: notification.timestamp || new Date(),
      read: notification.read || false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  // Method to reset all notifications (for troubleshooting)
  const resetNotifications = () => {
    console.log('Resetting all notifications and processed case IDs');
    setNotifications([]);
    setProcessedCaseIds(new Set());
    localStorage.removeItem('caseNotifications');
    localStorage.removeItem('processedCaseIds');
    localStorage.removeItem('lastNotificationCheck');
    setLastChecked(Date.now());
  };
  
  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    resetNotifications
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 