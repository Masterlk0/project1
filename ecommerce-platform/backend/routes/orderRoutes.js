const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware'); // protect and restrictTo

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware.protect);

// Buyer routes
router.post('/', authMiddleware.restrictTo('buyer', 'admin'), orderController.createOrder); // Buyers create orders, Admins might too for some cases
router.get('/my-orders', authMiddleware.restrictTo('buyer', 'admin'), orderController.getMyOrdersAsBuyer); // Buyers see their orders

// Routes for specific order (accessible by buyer, involved seller, or admin)
router.get('/:id', orderController.getOrderById); // Authorization handled in controller

// Seller/Admin routes for updating order status
router.patch('/:id/status', authMiddleware.restrictTo('seller', 'admin'), orderController.updateOrderStatus); // Sellers or Admins update status


// Future considerations:
// - Admin route to get all orders:
//   router.get('/', authMiddleware.restrictTo('admin'), orderController.getAllOrdersForAdmin);
// - More granular status updates or actions on orders.

module.exports = router;
