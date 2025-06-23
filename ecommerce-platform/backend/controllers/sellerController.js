const Product = require('../models/Product');
const Service = require('../models/Service');
const Order = require('../models/Order'); // Import the Order model
// const Lead = require('../models/Lead');   // To be implemented later

const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// @desc    Get all products listed by the current seller
// @route   GET /api/seller/dashboard/my-products
// @access  Private (Seller)
exports.getMyProducts = catchAsync(async (req, res, next) => {
  // req.user is attached by the 'protect' middleware
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).json({ status: 'fail', message: 'Access denied. Only sellers can view their products.' });
  }

  const products = await Product.find({ sellerId: req.user._id })
    .populate('sellerId', 'username email') // Populate seller info
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

// @desc    Get all services listed by the current seller
// @route   GET /api/seller/dashboard/my-services
// @access  Private (Seller)
exports.getMyServices = catchAsync(async (req, res, next) => {
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).json({ status: 'fail', message: 'Access denied. Only sellers can view their services.' });
  }

  const services = await Service.find({ sellerId: req.user._id })
    .populate('sellerId', 'username email') // Populate seller info
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: services.length,
    data: {
      services
    }
  });
});

// @desc    Get all sales orders for the current seller
// @route   GET /api/seller/dashboard/my-orders
// @access  Private (Seller)
exports.getMySalesOrders = catchAsync(async (req, res, next) => {
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).json({ status: 'fail', message: 'Access denied. Only sellers can view their orders.' });
  }

  // Find orders where at least one item has the current user as sellerId
  const orders = await Order.find({ 'items.sellerId': req.user._id })
    .populate('buyerId', 'username email') // Populate buyer details
    .populate('items.itemId', 'name')     // Populate item names for context
    .sort('-createdAt');

  // Optionally, filter/transform orders to only show relevant items for the seller if an order has multiple sellers.
  // For now, returning the full order if the seller is involved in any item.
  // const sellerSpecificOrders = orders.map(order => {
  //   const relevantItems = order.items.filter(item => item.sellerId.equals(req.user._id));
  //   return { ...order.toObject(), items: relevantItems }; // Replace items with only seller's items
  // });


  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders // or sellerSpecificOrders if transformation is applied
    }
  });
});

// @desc    Get all leads for the current seller's items
// @route   GET /api/seller/dashboard/my-leads
// @access  Private (Seller)
exports.getMyLeads = catchAsync(async (req, res, next) => {
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).json({ status: 'fail', message: 'Access denied. Only sellers can view their leads.' });
  }

  // Placeholder: Lead model and logic will be implemented later
  // This could involve querying leads based on itemIds that belong to the seller.
  // const products = await Product.find({ sellerId: req.user._id }).select('_id');
  // const services = await Service.find({ sellerId: req.user._id }).select('_id');
  // const itemIds = [...products.map(p => p._id), ...services.map(s => s._id)];
  // const leads = await Lead.find({ itemId: { $in: itemIds } }).populate('userId', 'username email').sort('-createdAt');

  res.status(200).json({
    status: 'success',
    message: 'Lead tracking for sellers will be implemented soon.',
    // results: leads.length, // Uncomment when leads are implemented
    // data: { // Uncomment when leads are implemented
    //   leads
    // }
    data: {
        leads: [] // Placeholder
    }
  });
});
