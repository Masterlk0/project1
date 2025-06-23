// Creating a separate schema for reviews to be embedded
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  username: { // Denormalize username for easier display
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Review comment cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = reviewSchema; // Export the schema itself, not a model
// We won't create a 'Review' model directly as these will be subdocuments.
// However, if reviews needed to be queried independently extensively, a separate model would be better.
