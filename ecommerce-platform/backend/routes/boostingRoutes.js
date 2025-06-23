const express = require('express');
const boostingController = require('../controllers/boostingController');
const authMiddleware = require('../middleware/authMiddleware'); // For user ID if logged in on recordLeadEndpoint

const router = express.Router();

// Routes to get trending items (public)
router.get('/trending-products', boostingController.getTrendingProducts);
router.get('/trending-services', boostingController.getTrendingServices);

// Route to record a lead/interaction
// This endpoint can be called by frontend for specific interactions,
// or used internally.
// authMiddleware.softProtect will try to load req.user if a token is provided,
// but will not fail if the user is anonymous. The controller handles userId being null.
router.post('/leads/record', authMiddleware.softProtect, boostingController.recordLeadEndpoint);

module.exports = router;
