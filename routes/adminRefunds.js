const express = require('express');
const auth = require('../middleware/auth');
const {
  getAllRefunds,
  getRefundStats,
  getRefundById,
  updateRefundStatus
} = require('../controllers/admin/refundController');

const router = express.Router();

// All routes require admin authentication
router.use(auth.requireAdmin);

// Get all refund requests with pagination
router.get('/all', getAllRefunds);

// Get refund statistics
router.get('/stats', getRefundStats);

// Get refund by ID
router.get('/:id', getRefundById);

// Update refund status
router.put('/:id/status', updateRefundStatus);



module.exports = router;
