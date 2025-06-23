const Product = require('../models/Product');
const Service = require('../models/Service');
const catchAsync = require('../utils/catchAsync'); // Assuming a catchAsync utility

// @desc    Add a review to a product
// @route   POST /api/products/:productId/reviews
// @access  Private (Authenticated users)
exports.addProductReview = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId;
  const userId = req.user._id;
  const username = req.user.username; // Get username from authenticated user

  if (!rating) {
    return res.status(400).json({ status: 'fail', message: 'Rating is required.' });
  }

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ status: 'fail', message: 'Product not found.' });
  }

  // Check if user already reviewed this product
  const existingReview = product.reviews.find(
    (r) => r.user.toString() === userId.toString()
  );

  if (existingReview) {
    return res.status(400).json({ status: 'fail', message: 'You have already reviewed this product.' });
  }

  // Optional: Check if user purchased this product (more complex, requires Order model check)
  // For now, any logged-in user can review.

  const review = {
    user: userId,
    username: username, // Store username
    rating: Number(rating),
    comment,
    createdAt: new Date()
  };

  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  product.averageRating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

  await product.save();

  res.status(201).json({
    status: 'success',
    message: 'Review added successfully.',
    data: { review } // Send back the created review (or all reviews for the product)
  });
});


// @desc    Add a review to a service
// @route   POST /api/services/:serviceId/reviews
// @access  Private (Authenticated users)
exports.addServiceReview = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;
  const serviceId = req.params.serviceId;
  const userId = req.user._id;
  const username = req.user.username;

  if (!rating) {
    return res.status(400).json({ status: 'fail', message: 'Rating is required.' });
  }

  const service = await Service.findById(serviceId);

  if (!service) {
    return res.status(404).json({ status: 'fail', message: 'Service not found.' });
  }

  const existingReview = service.reviews.find(
    (r) => r.user.toString() === userId.toString()
  );

  if (existingReview) {
    return res.status(400).json({ status: 'fail', message: 'You have already reviewed this service.' });
  }

  const review = {
    user: userId,
    username: username,
    rating: Number(rating),
    comment,
    createdAt: new Date()
  };

  service.reviews.push(review);
  service.numReviews = service.reviews.length;
  service.averageRating = service.reviews.reduce((acc, item) => item.rating + acc, 0) / service.reviews.length;

  await service.save();

  res.status(201).json({
    status: 'success',
    message: 'Review added successfully.',
    data: { review }
  });
});
