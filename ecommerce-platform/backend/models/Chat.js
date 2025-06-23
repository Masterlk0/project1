const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  // receiverId is implicitly known from the Chat participants or can be added if direct message to specific user in group chat
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: { // Indicates if the message has been read by the recipient(s)
    type: Boolean,
    default: false
  }
  // We can add a `readBy: [{ userId: mongoose.Schema.ObjectId, readAt: Date }]` for more granular read receipts
}, { _id: true }); // Ensure messages get their own _id if needed, though default is fine.

const chatSchema = new mongoose.Schema({
  participants: [{ // Array of user IDs participating in the chat
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }],
  // Optional: Link chat to a specific product or service inquiry
  relatedItemId: {
    type: mongoose.Schema.ObjectId,
    refPath: 'itemType' // Dynamic reference based on itemType
  },
  itemType: { // To specify if relatedItemId refers to 'Product' or 'Service'
    type: String,
    enum: ['Product', 'Service', null], // Allow null if chat is not item-specific
    default: null
  },
  messages: [messageSchema], // Array of messages
  lastMessage: { // Denormalized field for quick preview of the last message
    content: String,
    senderId: { type: mongoose.Schema.ObjectId, ref: 'User' },
    timestamp: Date
  },
  lastMessageAt: { // Timestamp of the last message, for sorting chats
    type: Date,
    default: Date.now,
    index: true // Index for efficient sorting
  },
  // unreadCounts: [{ // Optional: To track unread messages per participant
  //   userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
  //   count: { type: Number, default: 0 }
  // }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: { // Will be updated when a new message is added or chat details change
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

// Ensure there's an index on participants for querying chats by user
chatSchema.index({ participants: 1 });
chatSchema.index({ relatedItemId: 1, itemType: 1 }); // If chats are often queried by item

// Middleware to update `lastMessage` and `lastMessageAt` when a new message is added
// This is more complex with embedded documents. Often handled at application level when adding a message.
// For simplicity, we'll update these manually in the controller when a message is sent.

// Method to check if a user is a participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(participantId => participantId.equals(userId));
};


const Chat = mongoose.model('Chat', chatSchema);
const Message = mongoose.model('Message', messageSchema); // Export if direct manipulation of messages is needed, otherwise can be kept internal

module.exports = Chat;
