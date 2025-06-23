const Order = require('../models/Order');
const Product = require('../models/Product');
const Service = require('../models/Service');
const User = require('../models/User'); // For populating or checking roles
const mongoose = require('mongoose');

const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Buyer)
exports.createOrder = catchAsync(async (req, res, next) => {
  const { items, shippingAddress, serviceDate, serviceAddress, notesToSeller, paymentMethod } = req.body;
  const buyerId = req.user._id;

  if (!items || items.length === 0) {
    return res.status(400).json({ status: 'fail', message: 'Order must contain at least one item.' });
  }

  let totalAmount = 0;
  const orderItems = [];
  const sellerIdsInOrder = new Set(); // To track unique sellers in the order

  for (const item of items) {
    if (!item.itemId || !item.itemType || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({ status: 'fail', message: 'Invalid item data provided.' });
    }

    let dbItem;
    if (item.itemType === 'Product') {
      dbItem = await Product.findById(item.itemId);
      if (dbItem && dbItem.stock < item.quantity) {
        return res.status(400).json({ status: 'fail', message: `Not enough stock for ${dbItem.name}. Available: ${dbItem.stock}` });
      }
    } else if (item.itemType === 'Service') {
      dbItem = await Service.findById(item.itemId);
      // For services, availability check might be more complex (e.g., time slots)
      // For now, we assume service is available if it exists.
    } else {
      return res.status(400).json({ status: 'fail', message: `Invalid item type: ${item.itemType}` });
    }

    if (!dbItem) {
      return res.status(404).json({ status: 'fail', message: `${item.itemType} with ID ${item.itemId} not found.` });
    }

    orderItems.push({
      itemId: dbItem._id,
      itemType: item.itemType,
      name: dbItem.name,
      image: item.itemType === 'Product' && dbItem.images && dbItem.images.length > 0 ? dbItem.images[0] : undefined,
      quantity: item.quantity,
      priceAtPurchase: dbItem.price,
      sellerId: dbItem.sellerId
    });
    totalAmount += dbItem.price * item.quantity;
    sellerIdsInOrder.add(dbItem.sellerId.toString());
  }

  // Basic validation for shipping/service address based on item types
  const hasProduct = orderItems.some(item => item.itemType === 'Product');
  if (hasProduct && (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode || !shippingAddress.country)) {
      return res.status(400).json({ status: 'fail', message: 'Shipping address is required for orders with products.' });
  }
  // const hasService = orderItems.some(item => item.itemType === 'Service');
  // if (hasService && !serviceDate) { // Service date might be optional depending on service type
  //     return res.status(400).json({ status: 'fail', message: 'Service date is required for service bookings.' });
  // }


  const orderData = {
    buyerId,
    items: orderItems,
    totalAmount,
    shippingAddress: hasProduct ? shippingAddress : undefined,
    serviceDate,
    serviceAddress, // Could be same as shipping or different
    notesToSeller,
    paymentDetails: {
      method: paymentMethod || 'stripe_placeholder', // Default or from request
      status: 'pending' // Payment status initially pending
    },
    status: 'pending_payment' // Initial order status
  };

  const newOrder = new Order(orderData);

  // Important: Stock reduction is handled in the pre-save hook of the Order model
  // when the order status moves to a confirmed state or payment is completed.
  // Here, we are just creating the order with 'pending_payment'.

  await newOrder.save(); // This will trigger the pre-save hook if conditions are met

  res.status(201).json({
    status: 'success',
    data: {
      order: newOrder
    }
  });
});


// @desc    Get a specific order by ID
// @route   GET /api/orders/:id
// @access  Private (Buyer who owns it, or Seller of an item in it, or Admin)
exports.getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('buyerId', 'username email')
    .populate('items.itemId') // Populates the actual product/service from refPath
    .populate('items.sellerId', 'username email');

  if (!order) {
    return res.status(404).json({ status: 'fail', message: 'Order not found.' });
  }

  // Authorization: Allow buyer, or any seller whose item is in the order, or an admin
  const isBuyer = order.buyerId._id.toString() === req.user._id.toString();
  const isSellerInOrder = order.items.some(item => item.sellerId._id.toString() === req.user._id.toString());

  if (!isBuyer && !isSellerInOrder && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'fail', message: 'You are not authorized to view this order.' });
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

// @desc    Get all orders placed by the current buyer
// @route   GET /api/orders/my-orders
// @access  Private (Buyer)
exports.getMyOrdersAsBuyer = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ buyerId: req.user._id })
    .populate('items.itemId', 'name images') // Populate item name and image for summary
    .populate('items.sellerId', 'username')  // Populate seller username
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders
    }
  });
});


// @desc    Update order status (by Seller or Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private (Seller of an item in the order, or Admin)
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, cancellationReason } = req.body; // New status from request body
  const orderId = req.params.id;
  const userId = req.user._id;
  const userRole = req.user.role;

  if (!status) {
    return res.status(400).json({ status: 'fail', message: 'New order status is required.' });
  }

  // Validate the status value against the enum in the Order model
  const allowedStatuses = Order.schema.path('status').enumValues;
  if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ status: 'fail', message: `Invalid status value: ${status}.` });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ status: 'fail', message: 'Order not found.' });
  }

  // Authorization: Allow admin, or a seller whose item is in the order
  const isSellerInOrder = order.items.some(item => item.sellerId.equals(userId));

  if (userRole !== 'admin' && !isSellerInOrder) {
    return res.status(403).json({ status: 'fail', message: 'You are not authorized to update this order status.' });
  }

  // Specific logic for sellers: they can only update status if they are involved.
  // Admins can update any order.
  // More granular control might be needed if different sellers manage different items in the same order.
  // For now, any involved seller can update the overall order status. This might need refinement.

  // If payment moves to 'completed', update stock (pre-save hook handles this if status changes to confirmed)
  if (status === 'confirmed' || status === 'processing' || status === 'shipped' || status === 'delivered' || status === 'booked' || status === 'service_in_progress' || status === 'completed') {
    // If moving to a state that implies payment is done or not an issue
    if (order.paymentDetails.status === 'pending' && order.status === 'pending_payment') {
        order.paymentDetails.status = 'completed'; // Mark as paid if not already
        order.paymentDetails.paidAt = Date.now();

        // Trigger stock update for products if not already done by pre-save hook
        // The pre-save hook currently triggers on 'pending_confirmation', 'confirmed', or payment 'completed'.
        // If we are directly setting to 'confirmed' or similar, pre-save logic should handle stock.
        // No explicit stock update here needed due to pre-save hook.
    }
  }


  order.status = status;
  if (status.startsWith('cancelled') && cancellationReason) {
    order.cancellationReason = cancellationReason;
    // Here, you might also want to handle stock replenishment if an order is cancelled after stock deduction.
    // This logic can be complex (e.g., if items are perishable or custom).
    // For simplicity, basic stock replenishment:
    if (order.status === 'cancelled_by_seller' || order.status === 'cancelled_by_buyer') {
        for (const item of order.items) {
            if (item.itemType === 'Product') {
                await Product.findByIdAndUpdate(item.itemId, { $inc: { stock: item.quantity } });
            }
        }
    }
  }

  // order.updatedAt = Date.now(); // Mongoose timestamps should handle this

  await order.save(); // This will also trigger the pre-save hook.

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

// Placeholder for listing orders for a seller (will be in sellerController but uses Order model)
// exports.getMySalesAsSeller = ... (moved to sellerController.js and will be updated there)
