const mongoose = require('mongoose');
const Product = require('./Product'); // Needed for stock updates
// const Service = require('./Service'); // Needed if service booking affects availability counts

const orderItemSchema = new mongoose.Schema({
  itemId: { // ObjectId of the product or service
    type: mongoose.Schema.ObjectId,
    required: true,
    refPath: 'itemType' // Dynamic reference based on itemType
  },
  itemType: { // 'Product' or 'Service'
    type: String,
    required: true,
    enum: ['Product', 'Service']
  },
  name: { // Denormalized name of the item at time of purchase
    type: String,
    required: true
  },
  image: { // Denormalized main image URL at time of purchase (optional)
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1 // Default 1, especially for services
  },
  priceAtPurchase: { // Price of a single unit at the time of purchase
    type: Number,
    required: true
  },
  sellerId: { // Denormalized sellerId for easier querying of seller's orders
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, { _id: false }); // No separate _id for subdocuments unless needed

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'An order must belong to a buyer']
  },
  // sellerId is per item, but we can have a primary seller if order is for single seller items
  // For multi-seller cart, sellerId is in orderItemSchema.
  // If we want to easily query orders by a specific seller, we might need an array of sellerIds here.
  // For now, assuming an order can contain items from multiple sellers.

  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: [true, 'An order must have a total amount']
  },
  paymentDetails: {
    method: {
      type: String,
      // enum: ['stripe_placeholder', 'paypal_placeholder', 'cod_placeholder', 'bank_transfer_placeholder'],
      default: 'stripe_placeholder' // Placeholder
    },
    transactionId: { // From payment gateway
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date // Timestamp when payment was completed
  },
  status: { // Overall order status
    type: String,
    enum: [
      'pending_payment', // Waiting for payment confirmation
      'pending_confirmation', // Payment received, seller needs to confirm
      'confirmed', // Seller confirmed, processing begins
      'processing', // For physical goods, being prepared
      'shipped', // For physical goods
      'delivered', // For physical goods
      'booked', // For services
      'service_in_progress', // For services
      'completed', // Order fulfilled (product delivered or service rendered)
      'cancelled_by_buyer',
      'cancelled_by_seller',
      'disputed'
    ],
    default: 'pending_payment',
    required: true
  },
  shippingAddress: { // For physical products
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phoneNumber: String // Contact for delivery
  },
  serviceDate: { // For services, if applicable
    type: Date
  },
  serviceAddress: { // For services, if different from buyer's default or if on-site
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notesToSeller: String, // Optional notes from buyer
  cancellationReason: String, // If cancelled
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Manages createdAt and updatedAt automatically
});

// Indexes
orderSchema.index({ buyerId: 1, createdAt: -1 });
// To efficiently find orders containing items from a specific seller:
orderSchema.index({ 'items.sellerId': 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Pre-save middleware to update stock (if not handled transactionally elsewhere)
// This is a simplified version. In a real system, this needs to be robust,
// potentially part of a transaction if your DB supports it with Mongoose.
orderSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'pending_confirmation' || this.status === 'confirmed' || this.paymentDetails.status === 'completed') { // Or when payment is confirmed
    // Only adjust stock for new orders moving to a confirmed state
    // Or if an order is directly created in such a state (e.g. COD)
    try {
      for (const item of this.items) {
        if (item.itemType === 'Product') {
          const product = await Product.findById(item.itemId);
          if (product) {
            if (product.stock < item.quantity) {
              // Not enough stock, this order should ideally not reach this stage
              // Or be prevented at "createOrder" controller logic
              return next(new Error(`Not enough stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`));
            }
            product.stock -= item.quantity;
            await product.save({ validateBeforeSave: false }); // Save without full validation to avoid loops
          } else {
             return next(new Error(`Product with ID ${item.itemId} not found during stock update.`));
          }
        }
        // For services, stock/availability might be handled differently (e.g., time slots)
      }
    } catch (error) {
      console.error("Error updating stock in pre-save hook:", error);
      return next(error); // Propagate error
    }
  }
  next();
});


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
