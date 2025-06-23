const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A product must have a name'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Product description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'A product must have a category'],
    // Example categories, can be expanded or managed separately
    enum: ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Toys', 'Beauty', 'Groceries', 'Other'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'A product must have a price'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Product stock quantity is required'],
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  images: [{ // Array of strings (URLs to product images)
    type: String,
    trim: true
    // Later, we can add validation for URL format if needed
  }],
  sellerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Reference to the User model
    required: [true, 'A product must belong to a seller']
  },
  location: { // City/Region for filtering
    type: String,
    trim: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  // Consider adding ratings and reviews later as a sub-document or separate collection
  // averageRating: {
  //   type: Number,
  //   default: 0,
  //   min: [0, 'Rating must be above or equal to 0'],
  //   max: [5, 'Rating must be below or equal to 5'],
  //   set: val => Math.round(val * 10) / 10 // Rounds to one decimal place
  // },
  // numReviews: {
  //   type: Number,
  //   default: 0
  // }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true }, // Ensure virtuals are included when document is converted to JSON
  toObject: { virtuals: true } // Ensure virtuals are included when document is converted to a plain object
});

// Import ReviewSchema
const reviewSchema = require('./ReviewSchema');

productSchema.add({
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


// Indexing for better query performance
productSchema.index({ price: 1, category: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ name: 'text', description: 'text' }); // For text search
productSchema.index({ averageRating: -1 });


// Static method to calculate average rating (or can be done in controller on review submission)
// This can also be a pre-save middleware on the Product schema if reviews are modified directly
// For simplicity, let's assume we'll call this explicitly or use a controller-based update.
// Alternatively, a virtual for averageRating:
productSchema.virtual('calculatedAverageRating').get(function() {
  if (this.reviews && this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }
  return 0;
});

// Pre-save hook to update numReviews and averageRating if reviews are modified directly
// This is more robust if reviews are part of the product document updates.
// If reviews are added via a separate endpoint, that endpoint's controller should handle updating these.
// For this implementation, the controller adding a review will update these fields.


// Pre-find hook to populate user in reviews (optional, can be done in controller)
// SellerId is typically populated at the controller level for specific queries.
productSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'reviews.user', // Populate user who made the review
    select: 'username'
  });
  next();
});


const Product = mongoose.model('Product', productSchema);

module.exports = Product;
