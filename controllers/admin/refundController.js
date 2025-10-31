const Refund = require('../../models/Refund');
const Payment = require('../../models/Payment');
const { createRefund } = require('../../services/stripeService');

// Get all refund requests with pagination
const getAllRefunds = async (req, res) => {
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
};

// Get refund statistics
const getRefundStats = async (req, res) => {
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
};

// Get refund by ID
const getRefundById = async (req, res) => {
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
};

// Update refund status
const updateRefundStatus = async (req, res) => {
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

    // Allow updating processing refunds to succeeded/failed for manual resolution
    if (refund.status !== 'pending' && !(refund.status === 'processing' && ['succeeded', 'failed'].includes(status))) {
      return res.status(400).json({ success: false, error: 'Refund is not in pending or processing status' });
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
        // Get the full payment document to ensure we have the latest data
        const payment = await Payment.findById(refund.paymentId._id || refund.paymentId);

        if (!payment) {
          console.error('Payment not found for refund:', refund.paymentId);
          return res.status(404).json({
            success: false,
            error: 'Payment not found for refund processing'
          });
        }

        // Get payment intent ID from the payment
        const paymentIntentId = payment.stripePaymentIntentId;

        if (!paymentIntentId) {
          console.error('No Stripe payment intent ID found on payment:', payment._id);
          console.log('Payment details:', {
            id: payment._id,
            stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            status: payment.status,
            amount: payment.amount
          });

          // Try to get payment intent from checkout session if available
          if (payment.stripeCheckoutSessionId) {
            try {
              const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
              const session = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId);

              if (session.payment_intent) {
                console.log('Found payment intent from checkout session:', session.payment_intent);
                payment.stripePaymentIntentId = session.payment_intent;
                await payment.save();

                // Now create the refund with the found payment intent
                const stripeRefund = await createRefund(refund, session.payment_intent);
                refund.stripeRefundId = stripeRefund.id;
                refund.status = 'processing';
                console.log(`Stripe refund created from session: ${stripeRefund.id}`);
              } else {
                console.log('No payment intent found in checkout session - marking as succeeded without Stripe refund');
                refund.status = 'succeeded';
                refund.refundProcessedAt = new Date();
                refund.adminApproval.reviewNotes = 'No Stripe payment intent available - refund processed locally';
              }
            } catch (sessionError) {
              console.error('Error retrieving checkout session:', sessionError);
              console.log('Marking refund as succeeded without Stripe processing due to session error');
              refund.status = 'succeeded';
              refund.refundProcessedAt = new Date();
              refund.adminApproval.reviewNotes = 'Checkout session error - refund processed locally';
            }
          } else {
            console.log('No Stripe payment intent or checkout session - marking as succeeded without Stripe refund');
            refund.status = 'succeeded';
            refund.refundProcessedAt = new Date();
            refund.adminApproval.reviewNotes = 'No Stripe integration available - refund processed locally';
          }
        } else {
          // Create Stripe refund with the existing payment intent
          const stripeRefund = await createRefund(refund, paymentIntentId);

          // Update refund with Stripe ID
          refund.stripeRefundId = stripeRefund.id;
          refund.status = 'processing'; // Will be updated by webhook later

          console.log(`Stripe refund created: ${stripeRefund.id}`);
        }
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
    if ((status === 'succeeded' || (status === 'approved' && !refund.paymentId?.stripePaymentIntentId)) && refund.paymentId) {
      const payment = await Payment.findById(refund.paymentId._id || refund.paymentId);
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
};

// Check and update refund status from Stripe
const checkRefundStatus = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      return res.status(404).json({ success: false, error: 'Refund not found' });
    }

    if (!refund.stripeRefundId) {
      return res.status(400).json({ success: false, error: 'No Stripe refund ID found' });
    }

    const { getRefundDetails } = require('../../services/stripeService');
    const stripeRefund = await getRefundDetails(refund.stripeRefundId);

    let newStatus = refund.status;
    if (stripeRefund.status === 'succeeded' && refund.status === 'processing') {
      newStatus = 'succeeded';
      refund.refundProcessedAt = new Date();
    } else if (stripeRefund.status === 'failed' && refund.status === 'processing') {
      newStatus = 'failed';
    }

    if (newStatus !== refund.status) {
      refund.status = newStatus;
      await refund.save();

      // Update payment status if refund succeeded
      if (newStatus === 'succeeded' && refund.paymentId) {
        const payment = await Payment.findById(refund.paymentId);
        if (payment) {
          payment.status = 'refunded';
          await payment.save();
        }
      }
    }

    res.json({
      success: true,
      data: {
        refund,
        stripeStatus: stripeRefund.status,
        updated: newStatus !== refund.status
      },
      message: `Refund status checked. Stripe status: ${stripeRefund.status}`
    });
  } catch (error) {
    console.error('Error checking refund status:', error);
    res.status(500).json({ success: false, error: 'Failed to check refund status' });
  }
};

module.exports = {
  getAllRefunds,
  getRefundStats,
  getRefundById,
  updateRefundStatus,
  checkRefundStatus
};
