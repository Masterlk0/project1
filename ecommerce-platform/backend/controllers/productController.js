const Product = require('../models/Product');
const User = require('../models/User'); // To check seller role if needed, or for populating

// Factory function for error handling (optional, can be a separate utility)
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Ensure errors are passed to Express error handler
  };
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Seller)
exports.createProduct = catchAsync(async (req, res, next) => {
  // req.user is attached by the 'protect' middleware
  if (!req.user) {
    return res.status(401).json({ status: 'fail', message: 'User not authenticated.' });
  }
  if (req.user.role !== 'seller') {
    return res.status(403).json({ status: 'fail', message: 'Only sellers can create products.' });
  }

  const { name, description, category, price, stock, images, location } = req.body;

  if (!name || !category || price === undefined || stock === undefined) {
    return res.status(400).json({ status: 'fail', message: 'Please provide name, category, price, and stock for the product.' });
  }

  const product = await Product.create({
    name,
    description,
    category,
    price,
    stock,
    images: images || [],
    location,
    sellerId: req.user._id // Assign the logged-in seller as the owner
  });

  res.status(201).json({
    status: 'success',
    data: {
      product
    }
  });
});

// @desc    Get all products with filtering
// @route   GET /api/products
// @access  Public
exports.getAllProducts = catchAsync(async (req, res, next) => {
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Advanced filtering (e.g., price range)
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  let query = Product.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // Default sort
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v'); // Exclude __v by default
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100; // Default 100 items per page
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  if (req.query.page) {
    const numProducts = await Product.countDocuments(JSON.parse(queryStr));
    if (skip >= numProducts && numProducts > 0) { // check if numProducts > 0 to avoid error when no products found
        return res.status(404).json({status: 'fail', message: 'This page does not exist'});
    }
  }

  // Execute query
  const products = await query.populate('sellerId', 'username email'); // Populate seller info

  // Send response
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

const { recordInteraction } = require('./boostingController'); // Import interaction recorder

// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('sellerId', 'username email');

  if (!product) {
    return res.status(404).json({ status: 'fail', message: 'No product found with that ID' });
  }

  // Increment view count
  product.viewCount = (product.viewCount || 0) + 1;
  await product.save({ validateBeforeSave: false }); // Save without running full validations

  // Record this view interaction
  const userId = req.user ? req.user._id : null; // If user is logged in
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];
  recordInteraction(product._id, 'Product', userId, 'view', ipAddress, userAgent); // Fire-and-forget

  res.status(200).json({
    status: 'success',
    data: {
      product
    }
  });
});

// @desc    Update a product
// @route   PATCH /api/products/:id
// @access  Private (Seller who owns the product)
exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ status: 'fail', message: 'No product found with that ID' });
  }

  // Check if the logged-in user is the seller of the product
  if (product.sellerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ status: 'fail', message: 'You do not have permission to update this product.' });
  }
   // Ensure seller role (redundant if already checked by sellerId match, but good for clarity)
  if (req.user.role !== 'seller') {
    return res.status(403).json({ status: 'fail', message: 'Only sellers can update products.' });
  }

  // Fields that can be updated
  const allowedUpdates = ['name', 'description', 'category', 'price', 'stock', 'images', 'location', 'isFeatured'];
  const updates = {};
  for (const key in req.body) {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true, // Return the modified document rather than the original
    runValidators: true // Ensure updates adhere to schema validation
  });

  res.status(200).json({
    status: 'success',
    data: {
      product: updatedProduct
    }
  });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Seller who owns the product or Admin)
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ status: 'fail', message: 'No product found with that ID' });
  }

  // Check if the logged-in user is the seller of the product or an admin
  if (product.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'fail', message: 'You do not have permission to delete this product.' });
  }
  // Ensure seller role for non-admins (redundant if sellerId matches, but good for clarity)
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
     return res.status(403).json({ status: 'fail', message: 'Only sellers or admins can delete products.' });
  }


  await Product.findByIdAndDelete(req.params.id);

  res.status(204).json({ // 204 No Content
    status: 'success',
    data: null
  });
});
