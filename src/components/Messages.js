import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  TextField,
  IconButton,
  InputAdornment,
  Badge,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemButton,
  FormControlLabel,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EmojiPicker from 'emoji-picker-react';

// Custom styled components
const SidebarContainer = styled(Box)(({ theme }) => ({
  width: '300px',
  height: '100%',
  backgroundColor: '#6b88c9',
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid #5a75b0'
}));

// Add new styled component for connection status
const ConnectionStatus = styled(Box)(({ theme, connected }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  backgroundColor: connected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
  borderTop: '1px solid #5a75b0',
  transition: 'background-color 0.3s'
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #5a75b0'
}));

const ChatList = styled(List)(({ theme }) => ({
  flex: 1,
  padding: 0,
  overflowY: 'auto'
}));

const ChatItem = styled(ListItem)(({ theme, selected }) => ({
  padding: theme.spacing(1.5, 2),
  backgroundColor: selected ? '#5a75b0' : 'transparent',
  '&:hover': {
    backgroundColor: selected ? '#5a75b0' : '#7b96d1'
  },
  cursor: 'pointer'
}));

const SearchField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(1, 2),
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#7b96d1',
    borderRadius: '30px',
    color: 'white',
    height: '40px',
    '& fieldset': {
      borderColor: 'transparent',
    },
    '&:hover fieldset': {
      borderColor: 'transparent',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'white',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '8px 14px 8px 0',
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.7)',
      opacity: 1,
    },
  },
  '& .MuiInputAdornment-root': {
    color: 'white',
    marginLeft: '12px',
    marginRight: '4px',
  }
}));

const MainChatContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#f5f5f5'
}));

const ChatContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto'
}));

const MessageInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'white',
  borderTop: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center'
}));

const UserInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center'
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: 'white',
  color: '#6b88c9',
  fontWeight: 'bold'
}));

const ActionIcons = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1)
}));

const MessageBubble = styled(Box)(({ theme, isCurrentUser }) => ({
  maxWidth: '70%',
  minWidth: '100px',
  padding: theme.spacing(1.5),
  borderRadius: '18px',
  backgroundColor: isCurrentUser ? '#dcf8c6' : 'white',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(1),
  alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
  position: 'relative'
}));

const MessageGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: theme.spacing(2)
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: 'rgba(0, 0, 0, 0.6)',
  marginTop: '2px',
  textAlign: 'right'
}));

function Messages() {
  const { user } = useAuth();
  const { 
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
  } = useMessages();

  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageEndRef = useRef(null);
  
  // New conversation dialog state
  const [openNewChatDialog, setOpenNewChatDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [loadingNewChat, setLoading] = useState(false);
  
  // Add user to chat dialog state
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [usersToAdd, setUsersToAdd] = useState([]);

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set selected chat when current conversation changes
  useEffect(() => {
    if (currentConversation) {
      setSelectedChat(currentConversation);
    }
  }, [currentConversation]);

  const handleChatSelect = (id) => {
    setSelectedChat(id);
    fetchMessages(id);
  };

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedChat) {
      sendMessage(selectedChat, messageText.trim());
      setMessageText('');
      setShowEmojiPicker(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (emojiObject) => {
    setMessageText(prev => prev + emojiObject.emoji);
  };

  const handleNewChat = async () => {
    try {
      setLoading(true);
      await fetchUsers();
      // Short delay to ensure UI is ready before showing dialog
      setTimeout(() => {
        setOpenNewChatDialog(true);
        setLoading(false);
      }, 100);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenNewChatDialog(false);
    setSelectedUsers([]);
    setIsGroupChat(false);
    setGroupName('');
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      // Validate group name for group chats
      if (isGroupChat && !groupName.trim()) {
        alert("Please enter a group name");
        return;
      }

      // For one-on-one chats, use the other user's name as the conversation name
      let name = groupName;
      if (!isGroupChat && selectedUsers.length === 1) {
        const selectedUser = users.find(u => u.id === selectedUsers[0]);
        if (selectedUser) {
          name = `${selectedUser.first_name} ${selectedUser.last_name}`;
        }
      }

      // Create conversation
      const newConversation = await createConversation(name, isGroupChat, selectedUsers);
      
      // Close dialog and select the new conversation
      handleCloseDialog();
      
      // Set a short timeout to ensure state is updated before selecting the conversation
      setTimeout(() => {
        handleChatSelect(newConversation.id);
      }, 300);
      
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert("Failed to create conversation. Please try again.");
    }
  };

  // Handle opening the add user dialog
  const handleOpenAddUserDialog = async () => {
    try {
      setLoading(true);
      await fetchUsers();
      setOpenAddUserDialog(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  // Handle closing the add user dialog
  const handleCloseAddUserDialog = () => {
    setOpenAddUserDialog(false);
    setUsersToAdd([]);
  };

  // Toggle user selection for adding to chat
  const handleAddUserToggle = (userId) => {
    setUsersToAdd(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Add selected users to the current chat
  const handleAddUserToChat = async () => {
    if (usersToAdd.length === 0 || !selectedChat) return;

    try {
      await addUserToConversation(selectedChat, usersToAdd);
      handleCloseAddUserDialog();
    } catch (err) {
      console.error('Error adding users to chat:', err);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchText.trim()) return true;
    
    // Search by conversation name
    if (conv.name && conv.name.toLowerCase().includes(searchText.toLowerCase())) {
      return true;
    }
    
    // Search by participant names
    if (conv.participants && conv.participants.some(p => 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchText.toLowerCase())
    )) {
      return true;
    }
    
    // Search in last message
    if (conv.last_message && conv.last_message.toLowerCase().includes(searchText.toLowerCase())) {
      return true;
    }
    
    return false;
  });

  // Group messages by sender for UI display
  const groupedMessages = [];
  let currentGroup = null;

  messages.forEach(message => {
    const isCurrentUser = message.sender_id === user?.id;
    
    if (!currentGroup || 
        currentGroup.isCurrentUser !== isCurrentUser || 
        currentGroup.sender_id !== message.sender_id) {
      currentGroup = {
        sender_id: message.sender_id,
        isCurrentUser,
        sender_name: `${message.first_name} ${message.last_name}`,
        messages: []
      };
      groupedMessages.push(currentGroup);
    }
    
    currentGroup.messages.push(message);
  });

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <SidebarContainer>
        <ChatHeader>
          <Typography variant="h6" fontWeight="bold">Chats</Typography>
          <Box>
            <IconButton color="inherit" onClick={handleNewChat} title="New Chat">
              <AddIcon />
            </IconButton>
            <IconButton color="inherit" title="Settings">
              <SettingsIcon />
            </IconButton>
          </Box>
        </ChatHeader>
        
        <SearchField
          placeholder="Search..."
          variant="outlined"
          fullWidth
          value={searchText}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: '90%', mx: 'auto' }}
        />
        
        {loading && conversations.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress color="inherit" size={30} />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ m: 2 }}>
                {error}
              </Alert>
            )}
            
            {filteredConversations.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="white">
                  {searchText ? 'No chats match your search' : 'No conversations yet. Start a new chat!'}
                </Typography>
                {!searchText && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    onClick={handleNewChat}
                    sx={{ mt: 2, bgcolor: 'white', color: '#6b88c9', '&:hover': { bgcolor: '#f0f0f0' } }}
                  >
                    New Chat
                  </Button>
                )}
              </Box>
            ) : (
              <ChatList>
                {filteredConversations.map((conversation) => {
                  const participantNames = conversation.participants
                    ?.map(p => `${p.first_name} ${p.last_name}`)
                    .join(', ');
                  
                  // Get initials for avatar
                  let initials;
                  if (conversation.is_group) {
                    initials = 'GR';
                  } else if (conversation.participants && conversation.participants[0]) {
                    initials = getInitials(`${conversation.participants[0].first_name} ${conversation.participants[0].last_name}`);
                  } else {
                    initials = '?';
                  }
                  
                  return (
                    <React.Fragment key={conversation.id}>
                      <ChatItem 
                        selected={selectedChat === conversation.id}
                        onClick={() => handleChatSelect(conversation.id)}
                      >
                        <ListItemAvatar>
                          <Badge
                            color="error"
                            variant="dot"
                            invisible={!conversation.unread_count}
                            overlap="circular"
                            anchorOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                            }}
                          >
                            <Avatar sx={{ bgcolor: 'white', color: '#6b88c9' }}>
                              {initials}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={conversation.unread_count ? 'bold' : 'normal'}>
                              {conversation.name || participantNames}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="white" noWrap>
                              {conversation.last_message || 'No messages yet'}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography variant="caption" color="white">
                            {conversation.last_message_time || ''}
                          </Typography>
                          {conversation.unread_count > 0 && (
                            <Badge 
                              badgeContent={conversation.unread_count} 
                              color="error"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </ChatItem>
                      <Divider sx={{ backgroundColor: '#5a75b0' }} />
                    </React.Fragment>
                  );
                })}
              </ChatList>
            )}
          </>
        )}
        
        {/* Connection Status Bar at bottom of sidebar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: 1,
            borderTop: '1px solid #5a75b0',
            backgroundColor: connected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: connected ? '#4caf50' : '#f44336',
              marginRight: 1
            }}
          />
          <Typography variant="caption">
            {connected ? 'Real-time connected' : 'Offline mode'}
          </Typography>
        </Box>
      </SidebarContainer>

      {/* Main Chat Area */}
      <MainChatContainer>
        {selectedChat ? (
          <>
            {/* Get the selected conversation */}
            {(() => {
              const selectedConversation = conversations.find(conv => conv.id === selectedChat);
              if (!selectedConversation) return null;
              
              const participantNames = selectedConversation.participants
                ?.map(p => `${p.first_name} ${p.last_name}`)
                .join(', ');
                
              // Get avatar initials
              let initials;
              if (selectedConversation.is_group) {
                initials = 'GR';
              } else if (selectedConversation.participants && selectedConversation.participants[0]) {
                initials = getInitials(`${selectedConversation.participants[0].first_name} ${selectedConversation.participants[0].last_name}`);
              } else {
                initials = '?';
              }
              
              return (
                <>
                  {/* Chat Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: 2, 
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <UserInfo>
                      <UserAvatar>{initials}</UserAvatar>
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {selectedConversation.name || participantNames}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedConversation.is_group ? 
                            `${selectedConversation.participants?.length || 0} members` : 
                            'Online'}
                        </Typography>
                      </Box>
                    </UserInfo>
                    <ActionIcons>
                      <IconButton color="primary">
                        <CallIcon />
                      </IconButton>
                      <IconButton color="primary">
                        <VideocamIcon />
                      </IconButton>
                      <IconButton color="primary">
                        <InfoOutlinedIcon />
                      </IconButton>
                      {selectedConversation.is_group && (
                        <IconButton 
                          color="primary" 
                          onClick={handleOpenAddUserDialog}
                          title="Add Users"
                        >
                          <AddIcon />
                        </IconButton>
                      )}
                    </ActionIcons>
                  </Box>

                  {/* Chat Content */}
                  <ChatContentContainer>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                      </Box>
                    ) : groupedMessages.length === 0 ? (
                      <Box sx={{ textAlign: 'center', color: 'text.secondary', my: 'auto' }}>
                        <Typography variant="body1" gutterBottom>
                          No messages yet
                        </Typography>
                        <Typography variant="body2">
                          Be the first to send a message!
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        {groupedMessages.map((group, index) => (
                          <MessageGroup key={index}>
                            {!group.isCurrentUser && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {group.sender_name}
                              </Typography>
                            )}
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              alignItems: group.isCurrentUser ? 'flex-end' : 'flex-start'
                            }}>
                              {group.messages.map((message, mIndex) => (
                                <MessageBubble key={mIndex} isCurrentUser={group.isCurrentUser}>
                                  <Typography variant="body1">
                                    {message.content}
                                  </Typography>
                                  <MessageTime>
                                    {formatRelativeTime(message.created_at)}
                                  </MessageTime>
                                </MessageBubble>
                              ))}
                            </Box>
                          </MessageGroup>
                        ))}
                        <div ref={messageEndRef} />
                      </>
                    )}
                  </ChatContentContainer>

                  {/* Message Input */}
                  <MessageInputContainer>
                    <IconButton 
                      color="primary" 
                      size="small" 
                      onClick={toggleEmojiPicker}
                      title="Add Emoji"
                    >
                      <EmojiEmotionsIcon />
                    </IconButton>
                    
                    <Box sx={{ position: 'relative', width: '100%' }}>
                      <TextField
                        fullWidth
                        placeholder="Type a message..."
                        variant="outlined"
                        value={messageText}
                        onChange={handleMessageChange}
                        onKeyPress={handleKeyPress}
                        sx={{
                          mx: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '20px',
                            backgroundColor: '#f5f5f5',
                            '&:hover': {
                              backgroundColor: '#f0f0f0',
                            },
                            '&.Mui-focused': {
                              backgroundColor: '#f0f0f0',
                            }
                          }
                        }}
                      />
                      
                      {showEmojiPicker && (
                        <Box sx={{ position: 'absolute', bottom: '60px', right: 0, zIndex: 10 }}>
                          <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </Box>
                      )}
                    </Box>
                    
                    <IconButton 
                      color="primary" 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      title="Send Message"
                    >
                      <SendIcon />
                    </IconButton>
                  </MessageInputContainer>
                </>
              );
            })()}
          </>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              backgroundColor: '#f0f4f8',
              padding: 3,
              textAlign: 'center'
            }}
          >
            <img
              src="/images/chat-placeholder.png"
              alt="Start chatting"
              style={{ 
                width: '200px', 
                height: '200px', 
                marginBottom: '20px',
                opacity: 0.8
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/200?text=Start+Chatting';
              }}
            />
            <Typography variant="h5" color="text.primary" gutterBottom>
              Welcome to Messages
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '500px', mb: 3 }}>
              Connect with other users through private messages or group chats.
              Select a conversation from the sidebar or start a new one.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleNewChat}
            >
              New Conversation
            </Button>
          </Box>
        )}
      </MainChatContainer>

      {/* New Conversation Dialog */}
      <Dialog 
        open={openNewChatDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        keepMounted={false}
        TransitionProps={{
          mountOnEnter: true,
          unmountOnExit: true,
          timeout: {
            enter: 300,
            exit: 200
          }
        }}
        PaperProps={{
          sx: {
            opacity: 1,
            transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Create New Conversation
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingNewChat && users.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isGroupChat}
                    onChange={(e) => setIsGroupChat(e.target.checked)}
                  />
                }
                label="Create a group chat"
                sx={{ mb: 2 }}
              />
              
              {isGroupChat && (
                <TextField
                  fullWidth
                  label="Group Name"
                  variant="outlined"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                Select {isGroupChat ? 'participants' : 'a user'} to chat with:
              </Typography>
              
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                <List dense>
                  {users.map((user) => (
                    <ListItemButton 
                      key={user.id}
                      onClick={() => handleUserToggle(user.id)}
                      selected={selectedUsers.includes(user.id)}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {getInitials(`${user.first_name} ${user.last_name}`)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${user.first_name} ${user.last_name}`}
                        secondary={user.email}
                      />
                      <Checkbox
                        edge="end"
                        checked={selectedUsers.includes(user.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
              
              {users.length === 0 && (
                <Alert severity="info">
                  No users available to chat with.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateConversation} 
            color="primary" 
            variant="contained"
            disabled={
              selectedUsers.length === 0 || 
              (isGroupChat && !groupName.trim())
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Users to Chat Dialog */}
      <Dialog 
        open={openAddUserDialog} 
        onClose={handleCloseAddUserDialog}
        maxWidth="sm"
        fullWidth
        keepMounted={false}
        TransitionProps={{
          mountOnEnter: true,
          unmountOnExit: true,
          timeout: {
            enter: 300,
            exit: 200
          }
        }}
        PaperProps={{
          sx: {
            opacity: 1,
            transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Add Users to Chat
            <IconButton onClick={handleCloseAddUserDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingNewChat ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Select users to add to this chat:
              </Typography>
              
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                <List dense>
                  {users.filter(user => {
                    // Get the current conversation
                    const currentConv = conversations.find(c => c.id === selectedChat);
                    // Filter out users who are already in the conversation
                    return !currentConv?.participants?.some(p => p.id === user.id);
                  }).map((user) => (
                    <ListItemButton 
                      key={user.id}
                      onClick={() => handleAddUserToggle(user.id)}
                      selected={usersToAdd.includes(user.id)}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {getInitials(`${user.first_name} ${user.last_name}`)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${user.first_name} ${user.last_name}`}
                        secondary={user.email}
                      />
                      <Checkbox
                        edge="end"
                        checked={usersToAdd.includes(user.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
              
              {users.length === 0 && (
                <Alert severity="info">
                  No users available to add.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddUserDialog}>Cancel</Button>
          <Button 
            onClick={handleAddUserToChat} 
            color="primary" 
            variant="contained"
            disabled={usersToAdd.length === 0}
          >
            Add to Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Messages;