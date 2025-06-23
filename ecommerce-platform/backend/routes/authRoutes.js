const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// Placeholder for future auth routes (e.g., logout, forgotPassword, resetPassword)
// router.post('/logout', authController.logoutUser);
// router.post('/forgotPassword', authController.forgotPassword);
// router.patch('/resetPassword/:token', authController.resetPassword);
// router.patch('/updateMyPassword', authController.protect, authController.updatePassword); // Example of a protected route

module.exports = router;
