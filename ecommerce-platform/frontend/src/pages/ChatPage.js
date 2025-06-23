import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';

const chatPageStyle = {
  display: 'flex',
  height: 'calc(100vh - 120px)', // Adjust based on header/footer height
  border: '1px solid #ccc',
  margin: '10px auto',
  maxWidth: '1000px'
};

const chatListStyle = {
  width: '30%',
  borderRight: '1px solid #ccc',
  overflowY: 'auto',
  padding: '10px'
};

const chatListItemStyle = (isActive) => ({
  padding: '10px',
  borderBottom: '1px solid #eee',
  cursor: 'pointer',
  backgroundColor: isActive ? '#e0e0e0' : 'transparent',
  '&:hover': {
    backgroundColor: '#f0f0f0'
  }
});

const messageAreaStyle = {
  width: '70%',
  display: 'flex',
  flexDirection: 'column',
  padding: '10px'
};

const messagesContainerStyle = {
  flexGrow: 1,
  overflowY: 'auto',
  marginBottom: '10px',
  padding: '5px',
  border: '1px solid #eee',
  borderRadius: '5px',
  background: '#f9f9f9'
};

const messageStyle = (isSender) => ({
  maxWidth: '70%',
  padding: '8px 12px',
  borderRadius: '15px',
  marginBottom: '8px',
  wordWrap: 'break-word',
  alignSelf: isSender ? 'flex-end' : 'flex-start',
  backgroundColor: isSender ? '#dcf8c6' : '#fff',
  border: isSender ? '1px solid #cde6ba': '1px solid #ddd',
  marginLeft: isSender ? 'auto' : '0',
  marginRight: !isSender ? 'auto': '0',
});

const messageInputAreaStyle = {
  display: 'flex',
  paddingTop: '10px',
  borderTop: '1px solid #ccc'
};


const ChatPage = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // To get query params for initiating chat

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // Stores the full chat object with messages
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null); // For scrolling to bottom

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);


  // Fetch user's chats on component mount or when user logs in
  useEffect(() => {
    if (isAuthenticated && token) {
      setLoadingChats(true);
      chatService.getMyChats(token)
        .then(fetchedChats => {
          setChats(fetchedChats);
          setError('');
        })
        .catch(err => setError(err.message || 'Failed to load chats.'))
        .finally(() => setLoadingChats(false));
    } else {
      navigate('/login', {state: {from: location}});
    }
  }, [isAuthenticated, token, navigate, location]);

  // Effect to handle initiating a chat from URL query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const receiverId = queryParams.get('receiverId');
    const itemId = queryParams.get('itemId');
    const itemType = queryParams.get('itemType');

    if (receiverId && token && user) { // user must be available to avoid chatting with self
      const data = { receiverId };
      if (itemId) data.relatedItemId = itemId;
      if (itemType) data.itemType = itemType;

      // Prevent initiating chat with self
      if (user._id === receiverId) {
        // setError("You cannot start a chat with yourself.");
        // navigate('/chats'); // or some other default state
        return;
      }

      setLoadingMessages(true); // Indicate loading while we fetch/create chat
      chatService.createOrGetChat(data, token)
        .then(chat => {
          setActiveChat(chat);
          setMessages(chat.messages || []);
          // Add this new/fetched chat to the list if not already present or update it
          setChats(prevChats => {
            const existing = prevChats.find(c => c._id === chat._id);
            if (existing) return prevChats.map(c => c._id === chat._id ? chat : c);
            return [chat, ...prevChats];
          });
          navigate('/chat', { replace: true }); // Clean URL params
        })
        .catch(err => setError(err.message || 'Failed to start or get chat.'))
        .finally(() => setLoadingMessages(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, token, user, navigate]); // Rerun if query params or auth state change


  const selectChat = async (chat) => {
    if (activeChat && activeChat._id === chat._id) return; // Already selected

    setActiveChat(chat); // Set basic chat info first
    setLoadingMessages(true);
    setError('');
    try {
      const chatData = await chatService.getChatMessages(chat._id, token);
      setMessages(chatData.messages || []); // Backend sends { messages, participants }
      // Update the full activeChat object if needed, especially if participants info is useful
      setActiveChat(prev => ({...prev, ...chat, participants: chatData.participants}));
    } catch (err) {
      setError(err.message || `Failed to load messages for chat ${chat._id}.`);
      setMessages([]); // Clear messages on error for this chat
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !token) return;

    try {
      const sentMessage = await chatService.sendMessage(activeChat._id, newMessage, token);
      // Add the populated sender info from backend response
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      setNewMessage('');
      // Update last message in the chat list on the sidebar
      setChats(prevChats => prevChats.map(c =>
        c._id === activeChat._id
        ? {...c, lastMessage: { content: sentMessage.content, senderId: sentMessage.senderId, timestamp: sentMessage.timestamp }, lastMessageAt: sentMessage.timestamp }
        : c
      ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))); // Re-sort chats
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    }
  };

  const getChatParticipantName = (chat) => {
    if (!user || !chat.participants) return 'Chat';
    const otherParticipant = chat.participants.find(p => p._id !== user._id);
    return otherParticipant ? otherParticipant.username : 'Chat';
  };


  if (!isAuthenticated) return <p>Please login to use chat.</p>; // Should be handled by PrivateRoute

  return (
    <div style={chatPageStyle}>
      <div style={chatListStyle}>
        <h3>My Chats</h3>
        {loadingChats && <p>Loading chats...</p>}
        {!loadingChats && chats.length === 0 && <p>No active chats. Start a conversation from a product/service page!</p>}
        {chats.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt)) // Sort by most recent
              .map(chat => (
          <div
            key={chat._id}
            style={chatListItemStyle(activeChat && activeChat._id === chat._id)}
            onClick={() => selectChat(chat)}
          >
            <strong>{getChatParticipantName(chat)}</strong>
            {chat.lastMessage && (
                <p style={{fontSize: '0.9em', color: '#555', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {chat.lastMessage.senderId === user._id ? 'You: ' : ''}
                    {chat.lastMessage.content}
                </p>
            )}
            {/* Display item context if available */}
            {chat.relatedItemId && chat.relatedItemId.name && (
                 <p style={{fontSize: '0.8em', color: '#777', margin: '2px 0 0'}}>
                    Re: {chat.relatedItemId.name.substring(0,20)}...
                 </p>
            )}
          </div>
        ))}
      </div>

      <div style={messageAreaStyle}>
        {activeChat ? (
          <>
            <h3>Conversation with {getChatParticipantName(activeChat)}</h3>
            {activeChat.relatedItemId && activeChat.relatedItemId.name && (
                 <p style={{fontSize: '0.9em', color: '#555'}}>
                    Regarding: <a href={activeChat.itemType === 'Product' ? `/product/${activeChat.relatedItemId._id}` : `/service/${activeChat.relatedItemId._id}`}>{activeChat.relatedItemId.name}</a>
                 </p>
            )}
            <div style={messagesContainerStyle}>
              {loadingMessages && <p>Loading messages...</p>}
              {!loadingMessages && messages.map((msg, index) => (
                <div key={msg._id || index} style={messageStyle(msg.senderId._id === user._id)}>
                  <p style={{margin: 0}}><strong>{msg.senderId.username === user.username ? 'You' : msg.senderId.username}:</strong></p>
                  <p style={{margin: '2px 0'}}>{msg.content}</p>
                  <small style={{fontSize: '0.75em', color: '#888'}}>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} style={messageInputAreaStyle}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{flexGrow: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', marginRight: '10px'}}
                disabled={loadingMessages}
              />
              <button type="submit" style={{padding: '10px 15px', borderRadius: '20px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer'}} disabled={loadingMessages}>Send</button>
            </form>
          </>
        ) : (
          <p style={{textAlign: 'center', marginTop: '50px'}}>Select a chat to view messages or start a new one from a product/service page.</p>
        )}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
};

export default ChatPage;
