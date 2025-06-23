const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware.protect);

// Route to get all chats for the logged-in user
router.get('/my-chats', chatController.getMyChats);

// Route to create a new chat or get an existing one
// This could be with a seller (receiverId) about an item (relatedItemId, itemType)
// Or a general chat if item details are not provided.
router.post('/', chatController.createOrGetChat);

// Routes for a specific chat
router
  .route('/:chatId/messages')
  .get(chatController.getChatMessages)    // Get all messages for a chat
  .post(chatController.sendMessage);      // Send a message in a chat

// Example of how one might initiate a chat related to a specific product:
// POST /api/chats
// Body: { "receiverId": "sellerUserId", "relatedItemId": "productId", "itemType": "Product" }

// Example of sending a message:
// POST /api/chats/someChatId123/messages
// Body: { "content": "Hello, is this item still available?" }

module.exports = router;
