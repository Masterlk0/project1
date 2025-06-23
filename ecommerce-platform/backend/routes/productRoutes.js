const express = require('express');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController'); // Import reviewController
const authMiddleware = require('../middleware/authMiddleware'); // protect and restrictTo

const router = express.Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes - Accessible only by authenticated users
router.use(authMiddleware.protect);

// Seller specific routes - Accessible only by users with 'seller' role
router.post('/', authMiddleware.restrictTo('seller', 'admin'), productController.createProduct);

router
    .route('/:id')
    .patch(authMiddleware.restrictTo('seller', 'admin'), productController.updateProduct) // Seller or Admin can update
    .delete(authMiddleware.restrictTo('seller', 'admin'), productController.deleteProduct); // Seller or Admin can delete
// Ownership is checked within the controller methods (updateProduct, deleteProduct)
// to ensure only the product owner (seller) or an admin can perform the action.

// Review route for a specific product
router.post('/:productId/reviews', authMiddleware.protect, reviewController.addProductReview);

module.exports = router;
