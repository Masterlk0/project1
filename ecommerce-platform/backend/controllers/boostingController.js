const Product = require('../models/Product');
const Service = require('../models/Service');
const Lead = require('../models/Lead'); // For recording interactions

const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// @desc    Record a lead/interaction (e.g., item view)
// @access  Internal or Public (if called directly from frontend)
// This function is intended to be called internally by other controllers (e.g., getProductById)
// or could be exposed as an endpoint if frontend needs to record leads directly.
exports.recordInteraction = async (itemId, itemType, userId, interactionType = 'view', ipAddress, userAgent) => {
  try {
    if (!itemId || !itemType) {
      console.warn('Attempted to record interaction without itemId or itemType.');
      return; // Don't stop the main request, just log and return
    }

    // Validate item exists before recording lead (optional, but good practice)
    let itemExists = false;
    if (itemType === 'Product') {
      itemExists = await Product.findById(itemId).select('_id');
    } else if (itemType === 'Service') {
      itemExists = await Service.findById(itemId).select('_id');
    }

    if (!itemExists) {
      console.warn(`Attempted to record interaction for non-existent ${itemType} with ID: ${itemId}`);
      return;
    }

    await Lead.create({
      userId, // Can be null if user is not logged in
      itemId,
      itemType,
      interactionType,
      ipAddress,
      userAgent
      // engagementScore can be customized based on interactionType if needed
    });
    // console.log(`Interaction recorded: ${interactionType} for ${itemType} ${itemId}`);
  } catch (error) {
    // Log error but don't let it break the main request flow
    console.error('Error recording interaction:', error);
  }
};


// @desc    Get trending products
// @route   GET /api/boosting/trending-products
// @access  Public
exports.getTrendingProducts = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1 || 10; // Default to 10 trending products

  // Simple trending logic:
  // 1. Prioritize featured products.
  // 2. Among featured, sort by viewCount (or createdAt if viewCount is same).
  // 3. If not enough featured, fill with other products sorted by viewCount.

  // Get featured products, sorted by viewCount then createdAt
  const featuredProducts = await Product.find({ isFeatured: true })
    .sort('-viewCount -createdAt')
    .limit(limit)
    .populate('sellerId', 'username');

  let trendingProducts = featuredProducts;

  // If not enough featured products, get more based on viewCount
  if (trendingProducts.length < limit) {
    const additionalProductsNeeded = limit - trendingProducts.length;
    // Get IDs of already selected featured products to exclude them
    const excludeIds = trendingProducts.map(p => p._id);

    const otherPopularProducts = await Product.find({
        isFeatured: false,
        _id: { $nin: excludeIds } // Exclude already selected products
      })
      .sort('-viewCount -createdAt')
      .limit(additionalProductsNeeded)
      .populate('sellerId', 'username');

    trendingProducts = trendingProducts.concat(otherPopularProducts);
  }

  // Final sort if products from two queries were combined, though limit should handle it.
  // For more complex scoring, a dedicated score field updated periodically would be better.

  res.status(200).json({
    status: 'success',
    results: trendingProducts.length,
    data: {
      products: trendingProducts
    }
  });
});

// @desc    Get trending services
// @route   GET /api/boosting/trending-services
// @access  Public
exports.getTrendingServices = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1 || 10; // Default to 10 trending services

  // Simple trending logic (similar to products):
  // 1. Prioritize featured services.
  // 2. Sort by demandScore (if available and high), then viewCount.
  // 3. Fill with other services sorted by demandScore/viewCount.

  // Get featured services, sorted by demandScore, then viewCount, then createdAt
  const featuredServices = await Service.find({ isFeatured: true })
    .sort('-demandScore -viewCount -createdAt')
    .limit(limit)
    .populate('sellerId', 'username');

  let trendingServices = featuredServices;

  if (trendingServices.length < limit) {
    const additionalServicesNeeded = limit - trendingServices.length;
    const excludeIds = trendingServices.map(s => s._id);

    const otherPopularServices = await Service.find({
        isFeatured: false,
        _id: { $nin: excludeIds }
      })
      .sort('-demandScore -viewCount -createdAt')
      .limit(additionalServicesNeeded)
      .populate('sellerId', 'username');

    trendingServices = trendingServices.concat(otherPopularServices);
  }

  res.status(200).json({
    status: 'success',
    results: trendingServices.length,
    data: {
      services: trendingServices
    }
  });
});


// Endpoint to manually record a lead (e.g., from frontend if specific interaction needs tracking)
// @desc    Record a lead (e.g., specific button click)
// @route   POST /api/leads/record
// @access  Public (or Private if only internal)
exports.recordLeadEndpoint = catchAsync(async (req, res, next) => {
    const { itemId, itemType, interactionType } = req.body;
    const userId = req.user ? req.user._id : null; // If user is logged in
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    if (!itemId || !itemType || !interactionType) {
        return res.status(400).json({ status: 'fail', message: 'itemId, itemType, and interactionType are required.' });
    }

    // Call the internal interaction recording function
    await exports.recordInteraction(itemId, itemType, userId, interactionType, ipAddress, userAgent);

    res.status(201).json({
        status: 'success',
        message: 'Interaction recorded.'
    });
});
