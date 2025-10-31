const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  signup,
  login,
  updateProfile,
  getCurrentUser,
  getAffiliateInfo,
  checkAdmin,
  becomeAdmin
} = require('../controllers/user/authController');

// Send OTP Route
router.post('/send-otp', sendOTP);

// Verify OTP and Create User/Login Route
router.post('/verify-otp', verifyOTP);

// Signup Route
router.post('/signup', signup);

// Login Route
router.post('/login', login);

// Update user profile
router.put('/update-profile', updateProfile);

// Get current user (verify token)
router.get('/me', getCurrentUser);

// Get user's affiliate information
router.get('/affiliate-info', getAffiliateInfo);

// Check if admin exists
router.get('/check-admin', checkAdmin);

// Become first admin (for bootstrapping)
router.post('/become-admin', becomeAdmin);

module.exports = router;
