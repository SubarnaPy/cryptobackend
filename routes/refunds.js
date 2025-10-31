const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getUserRefunds,
  createRefundRequest
} = require('../controllers/user/refundController');

// User: Get their refund requests
router.get('/my-refunds', verifyToken, getUserRefunds);

// User: Create refund request
router.post('/request', verifyToken, createRefundRequest);


module.exports = router;
