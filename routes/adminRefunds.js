const express = require('express');
const auth = require('../middleware/auth');
const Refund = require('../models/Refund');
const Payment = require('../models/Payment');
const { createRefund } = require('../services/stripeService');

const router = express.Router();

// All routes require admin authentication
router.use(auth.requireAdmin);

// Get all refund requests with pagination
router.get('/all', async (req, res) => {
  try {
    const { status, page = 1, limit = 100 } = req.query;

    const query = status && status !== 'all' ? { status } : {};

    const refunds = await Refund.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email')
      .populate('paymentId', 'serviceDetails amount currency stripePaymentIntentId')
      .populate('adminApproval.approvedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Refund.countDocuments(query);

    // Transform refunds to match frontend expectations
    const transformedRefunds = refunds.map(refund => ({
      _id: refund._id,
      paymentId: refund.paymentId?._id || refund.paymentId,
      userEmail: refund.userId?.email || 'N/A',
      serviceId: refund.serviceId,
      serviceTitle: refund.serviceDetails?.title || 'Unknown Service',
      amount: refund.refundAmount, // Backend uses refundAmount
      currency: refund.currency,
      status: refund.status,
      reason: refund.refundReason || 'No reason provided', // Backend uses refundReason
      notes: refund.adminApproval?.reviewNotes || refund.statusReason,
      stripeRefundId: refund.stripeRefundId,
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt,
    }));

    res.json({
      success: true,
      data: {
        refunds: transformedRefunds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refund requests',
      error: error.message,
    });
  }
});

// Get refund statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Refund.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$refundAmount' },
        },
      },
    ]);

    const totalRefundsRequested = await Refund.countDocuments();
    const successfulRefunds = await Refund.countDocuments({ status: 'succeeded' });

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalRequests: totalRefundsRequested,
        successfulRefunds,
        successRate: totalRefundsRequested > 0 ? (successfulRefunds / totalRefundsRequested * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching refund stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refund statistics',
      error: error.message,
    });
  }
});

// Get refund by ID
router.get('/:id', async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('payment', 'amount stripePaymentId service')
      .populate('service', 'title price')
      .populate('processedBy', 'firstName lastName');

    if (!refund) {
      return res.status(404).json({ success: false, error: 'Refund not found' });
    }

    res.json({ success: true, data: refund });
  } catch (error) {
    console.error('Error fetching refund:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch refund' });
  }
});

// Update refund status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'processing', 'succeeded', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const refund = await Refund.findById(req.params.id)
      .populate('paymentId', 'stripePaymentIntentId status');

    if (!refund) {
      return res.status(404).json({ success: false, error: 'Refund not found' });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Refund is not in pending status' });
    }

    // Update refund
    refund.status = status;
    refund.statusReason = notes || '';
    refund.adminApproval.approved = ['approved', 'succeeded'].includes(status) ? true : (status === 'rejected' ? false : null);
    refund.adminApproval.approvedBy = req.user.userId || req.user._id;
    refund.adminApproval.approvedAt = new Date();

    // If approving, process the Stripe refund
    if (status === 'approved' && refund.paymentId) {
      try {
        // Get payment intent ID from the payment
        const paymentIntentId = refund.paymentId.stripePaymentIntentId;
        if (!paymentIntentId) {
          throw new Error('No payment intent ID found');
        }

        // Create Stripe refund
        const stripeRefund = await createRefund(refund, paymentIntentId);

        // Update refund with Stripe ID
        refund.stripeRefundId = stripeRefund.id;
        refund.status = 'processing'; // Will be updated by webhook later

        console.log(`Stripe refund created: ${stripeRefund.id}`);
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(500).json({
          success: false,
          error: 'Failed to process Stripe refund',
          details: stripeError.message
        });
      }
    }

    // If marking as succeeded or failed
    if (status === 'succeeded' || status === 'failed') {
      refund.refundProcessedAt = new Date();
    }

    // Update payment status if refund succeeded
    if (status === 'succeeded' && refund.paymentId) {
      const payment = await Payment.findById(refund.paymentId);
      if (payment) {
        payment.status = 'refunded';
        await payment.save();
      }
    }

    await refund.save();

    const message = status === 'approved'
      ? 'Refund approved and processed'
      : status === 'rejected'
        ? 'Refund request rejected'
        : status === 'succeeded'
          ? 'Refund successfully completed'
          : 'Refund status updated';

    res.json({
      success: true,
      data: refund,
      message: message
    });
  } catch (error) {
    console.error('Error updating refund status:', error);
    res.status(500).json({ success: false, error: 'Failed to update refund status' });
  }
});



module.exports = router;
