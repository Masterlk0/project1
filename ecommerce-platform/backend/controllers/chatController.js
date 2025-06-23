const Chat = require('../models/Chat');
const User = require('../models/User');
const Product = require('../models/Product'); // For validating item existence
const Service = require('../models/Service'); // For validating item existence
const mongoose = require('mongoose');


const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// @desc    Create or get an existing chat between current user and another user (typically a seller)
// @route   POST /api/chats
// @access  Private
// Body can include: receiverId, relatedItemId, itemType ('Product' or 'Service')
exports.createOrGetChat = catchAsync(async (req, res, next) => {
  const senderId = req.user._id; // Logged-in user
  const { receiverId, relatedItemId, itemType } = req.body;

  if (!receiverId) {
    return res.status(400).json({ status: 'fail', message: 'Receiver ID is required.' });
  }
  if (senderId.equals(receiverId)) {
    return res.status(400).json({ status: 'fail', message: 'Cannot create a chat with yourself.' });
  }

  const participants = [senderId, new mongoose.Types.ObjectId(receiverId)].sort(); // Sort to ensure consistent participant order for querying

  // Validate receiverId exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
      return res.status(404).json({ status: 'fail', message: 'Receiver not found.' });
  }

  let item = null;
  if (relatedItemId && itemType) {
    if (itemType === 'Product') {
      item = await Product.findById(relatedItemId);
    } else if (itemType === 'Service') {
      item = await Service.findById(relatedItemId);
    }
    if (!item) {
      return res.status(404).json({ status: 'fail', message: `${itemType} not found.` });
    }
    // Ensure the receiver is the seller of the item if chat is item-related
    if (!item.sellerId.equals(receiverId) && !item.sellerId.equals(senderId)) {
        // If sender is the seller, then receiverId must be the buyer (or vice versa)
        // This logic can be more complex depending on who initiates item-specific chat
        // For now, assume buyer initiates with seller, or seller with someone who inquired.
        // A simpler rule: if item is involved, one of the participants must be the seller.
        const itemSellerId = item.sellerId.toString();
        if (itemSellerId !== senderId.toString() && itemSellerId !== receiverId.toString()) {
             return res.status(403).json({ status: 'fail', message: 'Chat must involve the seller of the item.' });
        }
    }
  }


  // Try to find an existing chat
  // If relatedItemId is provided, look for a chat with these participants AND this item.
  // If not, look for a general chat between these participants.
  const queryCriteria = {
    participants: { $all: participants }
  };

  if (relatedItemId && itemType) {
    queryCriteria.relatedItemId = new mongoose.Types.ObjectId(relatedItemId);
    queryCriteria.itemType = itemType;
  } else {
    // If no item is specified, ensure we find a chat that is ALSO not item-specific.
    // Or, decide if any existing chat between users is fine. For now, let's be specific.
    queryCriteria.relatedItemId = null;
    queryCriteria.itemType = null;
  }

  let chat = await Chat.findOne(queryCriteria)
    .populate('participants', 'username email role')
    .populate('relatedItemId'); // Populate item details

  if (!chat) {
    // Create a new chat
    chat = await Chat.create({
      participants,
      relatedItemId: relatedItemId ? new mongoose.Types.ObjectId(relatedItemId) : null,
      itemType: relatedItemId ? itemType : null,
      messages: [] // Start with no messages
    });
    // Re-populate to get participant details and item details
    chat = await Chat.findById(chat._id)
        .populate('participants', 'username email role')
        .populate('relatedItemId');
  }

  res.status(chat.messages.length > 0 ? 200 : 201).json({ // 200 if existing, 201 if new
    status: 'success',
    data: {
      chat
    }
  });
});

// @desc    Send a message in a chat
// @route   POST /api/chats/:chatId/messages
// @access  Private
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;
  const { content } = req.body;
  const senderId = req.user._id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ status: 'fail', message: 'Message content cannot be empty.' });
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ status: 'fail', message: 'Chat not found.' });
  }

  // Check if the logged-in user is a participant of this chat
  if (!chat.isParticipant(senderId)) {
    return res.status(403).json({ status: 'fail', message: 'You are not a participant of this chat.' });
  }

  const message = {
    senderId,
    content,
    timestamp: new Date()
    // isRead will be default false
  };

  chat.messages.push(message);
  chat.lastMessage = {
    content: message.content,
    senderId: message.senderId,
    timestamp: message.timestamp
  };
  chat.lastMessageAt = message.timestamp;
  // chat.updatedAt = Date.now(); // Mongoose timestamps option should handle this

  await chat.save();

  // Populate sender details for the newly created message for the response
  const populatedMessage = chat.messages[chat.messages.length - 1]; // Get the last message
  await Chat.populate(populatedMessage, { path: 'senderId', select: 'username email' });


  res.status(201).json({
    status: 'success',
    data: {
      message: populatedMessage
    }
  });
});

// @desc    Get all chats for the current user
// @route   GET /api/chats/my-chats
// @access  Private
exports.getMyChats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const chats = await Chat.find({ participants: userId })
    .populate('participants', 'username email role')
    .populate('relatedItemId') // Populate item details if any
    .populate('lastMessage.senderId', 'username email') // Populate sender of last message
    .sort('-lastMessageAt'); // Sort by most recent activity

  res.status(200).json({
    status: 'success',
    results: chats.length,
    data: {
      chats
    }
  });
});

// @desc    Get all messages for a specific chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
exports.getChatMessages = catchAsync(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId)
    .populate({
        path: 'messages.senderId',
        select: 'username email role' // Fields to populate for message sender
    })
    .populate('participants', 'username email role'); // Also populate participant info for context

  if (!chat) {
    return res.status(404).json({ status: 'fail', message: 'Chat not found.' });
  }

  // Check if the logged-in user is a participant of this chat
  if (!chat.isParticipant(userId)) {
    return res.status(403).json({ status: 'fail', message: 'You are not authorized to view these messages.' });
  }

  // Optional: Mark messages as read for the current user
  // This would involve iterating through messages and updating their `isRead` status
  // or an array like `readBy` on each message object.
  // For simplicity, this is omitted for now but is a common feature.
  // Example:
  // chat.messages.forEach(msg => {
  //   if (!msg.senderId.equals(userId) && !msg.isRead) { // If not my message and unread
  //     // Mark as read logic here
  //   }
  // });
  // await chat.save();


  res.status(200).json({
    status: 'success',
    results: chat.messages.length,
    data: {
      messages: chat.messages,
      participants: chat.participants // Send participant info with messages
    }
  });
});
