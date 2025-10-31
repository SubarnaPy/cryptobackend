const express = require('express');
const auth = require('../middleware/auth');
const {
  getAllPayments,
  getPaymentById,
  getPaymentsByStatus,
  updatePaymentStatus,
  getPaymentAnalytics
} = require('../controllers/admin/paymentController');

const router = express.Router();

// All routes require admin authentication
router.use(auth.requireAdmin);

// Get all payments
router.get('/', getAllPayments);

// Get payment by ID
router.get('/:id', getPaymentById);

// Get payments by status
router.get('/status/:status', getPaymentsByStatus);

// Update payment status
router.put('/:id/status', updatePaymentStatus);

// Get payment analytics/overview
router.get('/analytics/overview', getPaymentAnalytics);

module.exports = router;
