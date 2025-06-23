const express = require('express');
const serviceController = require('../controllers/serviceController');
const reviewController = require('../controllers/reviewController'); // Import reviewController
const authMiddleware = require('../middleware/authMiddleware'); // protect and restrictTo

const router = express.Router();

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);

// Protected routes - Accessible only by authenticated users
router.use(authMiddleware.protect);

// Seller specific routes - Accessible only by users with 'seller' (or 'admin') role
router.post('/', authMiddleware.restrictTo('seller', 'admin'), serviceController.createService);

router
  .route('/:id')
  .patch(authMiddleware.restrictTo('seller', 'admin'), serviceController.updateService) // Seller or Admin can update
  .delete(authMiddleware.restrictTo('seller', 'admin'), serviceController.deleteService); // Seller or Admin can delete
// Ownership is checked within the controller methods (updateService, deleteService)
// to ensure only the service owner (seller) or an admin can perform the action.

// Review route for a specific service
router.post('/:serviceId/reviews', authMiddleware.protect, reviewController.addServiceReview);

module.exports = router;
