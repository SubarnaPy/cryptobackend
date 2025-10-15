const express = require('express');
const router = express.Router();
const Refund = require('../models/Refund');
const Payment = require('../models/Payment');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { createRefund } = require('../services/stripeService');

// User: Get their refund requests
router.get('/my-refunds', verifyToken, async (req, res) => {
  try {
    const refunds = await Refund.find({ userId: req.user._id }) // Changed from req.user.userId to req.user._id
      .sort({ createdAt: -1 })
      .populate('paymentId', 'serviceDetails amount currency')
      .populate('adminApproval.approvedBy', 'firstName lastName');

    res.json({
      success: true,
      data: refunds,
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refund requests',
      error: error.message,
    });
  }
});

// User: Create refund request
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { paymentId, refundReason } = req.body;

    // Validate required fields
    if (!paymentId || !refundReason) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and refund reason are required',
      });
    }

    // Find the payment using MongoDB _id
    console.log('Searching for payment:', { paymentId, userId: req.user._id });
    
    const payment = await Payment.findOne({
      _id: paymentId,
      userId: req.user._id, // Changed from req.user.userId to req.user._id
      status: { $in: ['succeeded', 'processing'] },
    });

    console.log('Payment found:', !!payment);
    if (payment) {
      console.log('Payment details:', {
        id: payment._id,
        userId: payment.userId,
        status: payment.status,
        amount: payment.amount
      });
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or not eligible for refund',
      });
    }

    // Check if refund already exists
    const existingRefund = await Refund.findOne({
      paymentId: payment._id,
      status: { $in: ['pending', 'approved', 'processing', 'succeeded'] },
    });

    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: 'A refund request already exists for this payment',
      });
    }

    // Create refund request
    const refund = new Refund({
      paymentId: payment._id,
      userId: req.user._id, // Changed from req.user.userId to req.user._id
      serviceId: payment.serviceId,
      refundReason: refundReason.trim(),
      refundAmount: payment.amount,
      currency: payment.currency,
      serviceDetails: {
        title: payment.serviceDetails?.title || 'Service',
        consultant: payment.serviceDetails?.consultant || 'N/A',
        originalPaymentAmount: payment.amount,
      },
    });

    await refund.save();

    res.status(201).json({
      success: true,
      data: refund,
      message: 'Refund request submitted successfully',
    });
  } catch (error) {
    console.error('Error creating refund request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create refund request',
      error: error.message,
    });
  }
});


module.exports = router;
