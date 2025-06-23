const Service = require('../models/Service');
const User = require('../models/User'); // For role checks or populating

// Factory function for error handling
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (Seller)
exports.createService = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'fail', message: 'User not authenticated.' });
  }
  if (req.user.role !== 'seller') {
    return res.status(403).json({ status: 'fail', message: 'Only sellers can create services.' });
  }

  const { name, description, type, price, pricingModel, availability, location } = req.body;

  if (!name || !type || price === undefined || !location) {
    return res.status(400).json({ status: 'fail', message: 'Please provide name, type, price, and location for the service.' });
  }

  const service = await Service.create({
    name,
    description,
    type,
    price,
    pricingModel,
    availability,
    location,
    sellerId: req.user._id // Assign the logged-in seller
  });

  res.status(201).json({
    status: 'success',
    data: {
      service
    }
  });
});

// @desc    Get all services with filtering
// @route   GET /api/services
// @access  Public
exports.getAllServices = catchAsync(async (req, res, next) => {
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  let query = Service.find(JSON.parse(queryStr));

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
    query = query.select('-__v');
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  if (req.query.page) {
    const numServices = await Service.countDocuments(JSON.parse(queryStr));
    if (skip >= numServices && numServices > 0) {
        return res.status(404).json({status: 'fail', message: 'This page does not exist'});
    }
  }

  const services = await query.populate('sellerId', 'username email'); // Populate seller info

  res.status(200).json({
    status: 'success',
    results: services.length,
    data: {
      services
    }
  });
});

const { recordInteraction } = require('./boostingController'); // Import interaction recorder

// @desc    Get a single service by ID
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id).populate('sellerId', 'username email');

  if (!service) {
    return res.status(404).json({ status: 'fail', message: 'No service found with that ID' });
  }

  // Increment view count
  service.viewCount = (service.viewCount || 0) + 1;
  await service.save({ validateBeforeSave: false });

  // Record this view interaction
  const userId = req.user ? req.user._id : null; // If user is logged in
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];
  recordInteraction(service._id, 'Service', userId, 'view', ipAddress, userAgent); // Fire-and-forget

  res.status(200).json({
    status: 'success',
    data: {
      service
    }
  });
});

// @desc    Update a service
// @route   PATCH /api/services/:id
// @access  Private (Seller who owns the service)
exports.updateService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(404).json({ status: 'fail', message: 'No service found with that ID' });
  }

  if (service.sellerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ status: 'fail', message: 'You do not have permission to update this service.' });
  }
  if (req.user.role !== 'seller') {
    return res.status(403).json({ status: 'fail', message: 'Only sellers can update services.' });
  }

  // Fields that can be updated
  const allowedUpdates = ['name', 'description', 'type', 'price', 'pricingModel', 'availability', 'location', 'isFeatured', 'demandScore'];
  const updates = {};
  for (const key in req.body) {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  }

  const updatedService = await Service.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      service: updatedService
    }
  });
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private (Seller who owns the service or Admin)
exports.deleteService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(404).json({ status: 'fail', message: 'No service found with that ID' });
  }

  if (service.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ status: 'fail', message: 'You do not have permission to delete this service.' });
  }
   if (req.user.role !== 'seller' && req.user.role !== 'admin') {
     return res.status(403).json({ status: 'fail', message: 'Only sellers or admins can delete services.' });
  }

  await Service.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});
