const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getUserPayments,
  getPaymentById,
  createServiceCheckoutSession,
  createCartCheckoutSession
} = require('../controllers/user/paymentController');

// Get user's payment history (bookings)
router.get('/my-payments', verifyToken, getUserPayments);

// Get payment by ID
router.get('/:paymentId', verifyToken, getPaymentById);

// Create checkout session for service purchase
router.post('/create-checkout-session', verifyToken, createServiceCheckoutSession);

// Create checkout session for cart items
router.post('/create-cart-checkout', verifyToken, createCartCheckoutSession);

module.exports = router;
