import axios from 'axios';

const API_URL = '/api/chats'; // Proxy handles redirection

// Create a new chat or get an existing one
// data typically includes: { receiverId, relatedItemId (optional), itemType (optional) }
const createOrGetChat = async (data, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.post(API_URL, data, config);
    // Backend returns { status: 'success', data: { chat } }
    return response.data.data.chat;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to create or get chat';
    console.error('Create/Get chat service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Send a message in a specific chat
const sendMessage = async (chatId, content, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.post(`${API_URL}/${chatId}/messages`, { content }, config);
    // Backend returns { status: 'success', data: { message } }
    return response.data.data.message;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to send message';
    console.error('Send message service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Get all chats for the current user
const getMyChats = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API_URL}/my-chats`, config);
    // Backend returns { status: 'success', results: chats.length, data: { chats } }
    return response.data.data.chats;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch user chats';
    console.error('Get my chats service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

// Get all messages for a specific chat
const getChatMessages = async (chatId, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API_URL}/${chatId}/messages`, config);
    // Backend returns { status: 'success', results: messages.length, data: { messages, participants } }
    return response.data.data; // Contains messages and participants
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch chat messages';
    console.error('Get chat messages service error:', error.response?.data || error.message);
    throw new Error(message);
  }
};

const chatService = {
  createOrGetChat,
  sendMessage,
  getMyChats,
  getChatMessages,
};

export default chatService;
