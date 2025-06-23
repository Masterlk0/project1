const express = require('express');
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middleware/authMiddleware'); // protect and restrictTo

const router = express.Router();

// All routes in this file should be protected and restricted to sellers
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('seller')); // Only users with 'seller' role can access these

router.get('/dashboard/my-products', sellerController.getMyProducts);
router.get('/dashboard/my-services', sellerController.getMyServices);
router.get('/dashboard/my-orders', sellerController.getMySalesOrders); // Placeholder
router.get('/dashboard/my-leads', sellerController.getMyLeads);       // Placeholder

// Future routes for seller dashboard could include:
// - Analytics (e.g., total sales, popular items)
// - Profile management specific to seller aspects
// - Payout information, etc.

module.exports = router;
