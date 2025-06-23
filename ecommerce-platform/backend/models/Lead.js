const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  userId: { // User who showed interest, can be null if user is not logged in
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  itemId: { // The product or service that was interacted with
    type: mongoose.Schema.ObjectId,
    required: true,
    refPath: 'itemType' // Dynamic reference
  },
  itemType: { // 'Product' or 'Service'
    type: String,
    required: true,
    enum: ['Product', 'Service']
  },
  interactionType: { // Type of interaction
    type: String,
    required: true,
    enum: ['view', 'inquiry_started', 'saved_for_later', 'seller_contacted'], // Can be expanded
    default: 'view'
  },
  // Optional: For more advanced AI, store some anonymized or aggregated user profile hints
  // Ensure compliance with privacy regulations if storing user-specific data.
  // userProfileHints: {
  //   ageRange: String, // e.g., "25-34"
  //   locationApproximation: String, // e.g., "City" or "Region"
  //   deviceType: String, // e.g., "mobile", "desktop"
  //   interestsFromSession: [String] // e.g., categories viewed in current session
  // },
  engagementScore: { // A simple score, can be incremented based on interaction type
    type: Number,
    default: 1
  },
  ipAddress: { // Store IP for rate limiting or coarse location, consider privacy implications
    type: String
  },
  userAgent: { // Store user agent for analytics
    type: String
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for common queries
leadSchema.index({ itemId: 1, itemType: 1 });
leadSchema.index({ userId: 1 });
leadSchema.index({ interactionType: 1 });
leadSchema.index({ createdAt: -1 }); // For time-based analysis

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
