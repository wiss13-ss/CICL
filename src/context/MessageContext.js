import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

// Create the context
const MessageContext = createContext();

// Custom hook to use the context
export const useMessages = () => useContext(MessageContext);

// Provider component
export const MessageProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  
  // WebSocket reference
  const socketRef = useRef(null);

  // Initialize axios with auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Close existing connection if any
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Create new WebSocket connection
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws` 
        : 'ws://localhost:5000/ws';
        
      // Properly append token as a query parameter
      const wsUrlWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;
      
      console.log('Connecting to WebSocket...');
      socketRef.current = new WebSocket(wsUrlWithToken);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (socketRef.current && socketRef.current.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout');
          setConnected(false);
          
          // Try to reconnect
          initializeWebSocket();
        }
      }, 5000);
      
      // Connection opened
      socketRef.current.addEventListener('open', (event) => {
        console.log('WebSocket connected');
        clearTimeout(connectionTimeout);
        setConnected(true);
        setError(null);
      });
      
      // Listen for messages
      socketRef.current.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data.type);
          
          if (data.type === 'new_message') {
            handleNewMessage(data.payload);
          } else if (data.type === 'conversation_update') {
            handleConversationUpdate(data.payload);
          } else if (data.type === 'user_added') {
            handleUserAdded(data.payload);
          } else if (data.type === 'connection_established') {
            console.log('WebSocket authentication successful');
          } else if (data.type === 'error') {
            console.error('WebSocket error message:', data.payload.message);
            setError(data.payload.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      // Connection closed
      socketRef.current.addEventListener('close', (event) => {
        console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
        clearTimeout(connectionTimeout);
        setConnected(false);
        
        // Try to reconnect after a delay, using exponential backoff
        const reconnectDelay = Math.min(30000, 3000 * Math.pow(2, Math.floor(Math.random() * 4)));
        console.log(`Reconnecting in ${reconnectDelay/1000} seconds...`);
        
        setTimeout(() => {
          initializeWebSocket();
        }, reconnectDelay);
      });
      
      // Connection error
      socketRef.current.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
        setError('Connection error. Trying to reconnect...');
      });
    };
    
    initializeWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Handle new message received via WebSocket
  const handleNewMessage = (message) => {
    // Update messages if it's for the current conversation
    if (message.conversation_id === currentConversation) {
      setMessages(prev => [...prev, message]);
    }
    
    // Update the conversation in the list
    setConversations(prev => {
      const updatedConversations = prev.map(conv => {
        if (conv.id === message.conversation_id) {
          return {
            ...conv,
            last_message: message.content,
            last_message_time: 'Just now',
            unread_count: conv.id === currentConversation ? 0 : (conv.unread_count || 0) + 1
          };
        }
        return conv;
      });
      
      // Sort conversations to put the most recent at the top
      return [...updatedConversations].sort((a, b) => {
        if (a.id === message.conversation_id) return -1;
        if (b.id === message.conversation_id) return 1;
        return 0;
      });
    });
  };
  
  // Handle conversation update received via WebSocket
  const handleConversationUpdate = (conversation) => {
    setConversations(prev => {
      const exists = prev.some(c => c.id === conversation.id);
      
      if (exists) {
        return prev.map(c => c.id === conversation.id ? conversation : c);
      } else {
        return [conversation, ...prev];
      }
    });
  };
  
  // Handle user added to conversation via WebSocket
  const handleUserAdded = (data) => {
    const { conversation_id, user } = data;
    
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === conversation_id) {
          return {
            ...conv,
            participants: [...(conv.participants || []), user]
          };
        }
        return conv;
      });
    });
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/messages/conversations');
      setConversations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };

  // Fetch users for creating new conversations
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/messages/users');
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      setLoading(false);
    }
  };

  // Create a new conversation
  const createConversation = async (name, isGroup, participantIds) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create the request payload
      const payload = {
        name,
        is_group: isGroup,
        participant_ids: participantIds
      };
      
      // Send the request to create conversation
      const response = await axios.post('/api/messages/conversations', payload);
      
      // Get the new conversation ID
      const conversationId = response.data.id;
      
      // Fetch participant details for this new conversation
      const participantsResponse = await axios.get(`/api/messages/conversations/${conversationId}/participants`);
      
      // Combine the conversation data with participants
      const newConversation = {
        ...response.data,
        participants: participantsResponse.data || [],
        last_message: null,
        last_message_time: null,
        unread_count: 0
      };
      
      // Update conversations list with new conversation at the top
      setConversations(prev => [newConversation, ...prev]);
      
      // Set the newly created conversation as current
      setCurrentConversation(newConversation.id);
      setMessages([]); // Clear previous messages
      
      setLoading(false);
      return newConversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err.response?.data?.message || 'Failed to create conversation');
      setLoading(false);
      throw err;
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/messages/conversations/${conversationId}/messages`);
      setMessages(response.data);
      setCurrentConversation(conversationId);
      
      // Update the conversations list to reflect read messages
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      );
      setConversations(updatedConversations);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (conversationId, content, attachmentUrl = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create message object
      const messageData = {
        content,
        attachment_url: attachmentUrl
      };
      
      // Try to send via WebSocket if connected
      if (connected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log('Sending message via WebSocket');
        socketRef.current.send(JSON.stringify({
          type: 'send_message',
          payload: {
            conversation_id: conversationId,
            ...messageData
          }
        }));
        
        // Optimistically update UI
        const tempId = `temp-${Date.now()}`;
        const user = JSON.parse(localStorage.getItem('user')) || {};
        const optimisticMessage = {
          id: tempId,
          conversation_id: conversationId,
          sender_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          content,
          attachment_url: attachmentUrl,
          created_at: new Date().toISOString(),
          is_read: true,
          _optimistic: true
        };
        
        // Add to messages
        setMessages(prev => [...prev, optimisticMessage]);
        
        // Update the conversations list
        updateConversation(conversationId, content);
        
        setLoading(false);
        return optimisticMessage;
      } else {
        console.log('WebSocket not connected, falling back to HTTP');
        // Fallback to REST API if WebSocket is not available
        const response = await axios.post(`/api/messages/conversations/${conversationId}/messages`, messageData);
        
        // Add the new message to the messages list
        setMessages(prev => [...prev, response.data]);
        
        // Update the conversations list
        updateConversation(conversationId, content);
        
        setLoading(false);
        return response.data;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setLoading(false);
      throw err;
    }
  };
  
  // Helper to update conversation with new message
  const updateConversation = (conversationId, content) => {
    // Update the conversations list to show the latest message
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return { 
          ...conv, 
          last_message: content,
          last_message_time: 'Just now'
        };
      }
      return conv;
    });
    
    // Sort conversations to put the most recent at the top
    const sortedConversations = [...updatedConversations].sort((a, b) => {
      if (a.id === conversationId) return -1;
      if (b.id === conversationId) return 1;
      return 0;
    });
    
    setConversations(sortedConversations);
  };

  // Add users to an existing conversation
  const addUserToConversation = async (conversationId, userIds) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`/api/messages/conversations/${conversationId}/users`, {
        user_ids: userIds
      });
      
      // Update the conversation in the list
      const updatedConversations = conversations.map(conv => {
        if (conv.id === conversationId) {
          return response.data;
        }
        return conv;
      });
      
      setConversations(updatedConversations);
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error('Error adding users to conversation:', err);
      setError('Failed to add users to conversation');
      setLoading(false);
      throw err;
    }
  };

  // Initialize the context by loading conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Context value
  const value = {
    conversations,
    messages,
    currentConversation,
    loading,
    error,
    users,
    connected,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    fetchUsers,
    addUserToConversation
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext; 