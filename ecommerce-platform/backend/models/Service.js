const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A service must have a name'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Service description cannot exceed 1000 characters']
  },
  type: { // Category of service
    type: String,
    required: [true, 'A service must have a type/category'],
    // Example types, can be expanded or managed separately
    enum: ['Beauty', 'Home Repair', 'Transport', 'Tutoring', 'Consulting', 'Wellness', 'Events', 'Other'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'A service must have a price'],
    min: [0, 'Price cannot be negative']
  },
  pricingModel: { // e.g., "hourly", "fixed", "per_session"
    type: String,
    enum: ['hourly', 'fixed', 'per_session', 'package', 'custom'],
    default: 'fixed'
  },
  availability: { // e.g., "Mon-Fri 9am-5pm", specific dates, general notes
    type: String,
    trim: true
  },
  location: { // Service area/City for filtering
    type: String,
    required: [true, 'Service location or service area is required'],
    trim: true
  },
  sellerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Reference to the User model
    required: [true, 'A service must be offered by a seller']
  },
  demandScore: { // For AI boosting, can be influenced by views, bookings, ratings
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  // averageRating: {
  //   type: Number,
  //   default: 0,
  //   min: [0, 'Rating must be above or equal to 0'],
  //   max: [5, 'Rating must be below or equal to 5'],
  //   set: val => Math.round(val * 10) / 10
  // },
  // numReviews: {
  //   type: Number,
  //   default: 0
  // }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Import ReviewSchema
const reviewSchema = require('./ReviewSchema');

serviceSchema.add({
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating must be at most 5'],
    set: (val) => Math.round(val * 10) / 10, // Rounds to one decimal place
  },
  numReviews: {
    type: Number,
    default: 0,
  }
});

// Indexing
serviceSchema.index({ price: 1, type: 1 });
serviceSchema.index({ sellerId: 1 });
serviceSchema.index({ location: 1 });
serviceSchema.index({ name: 'text', description: 'text' });
serviceSchema.index({ averageRating: -1 });


// Virtual for calculatedAverageRating (similar to Product)
serviceSchema.virtual('calculatedAverageRating').get(function() {
  if (this.reviews && this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }
  return 0;
});

// Pre-find hook to populate user in reviews
serviceSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'reviews.user', // Populate user who made the review
    select: 'username'
  });
  next();
});


const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
