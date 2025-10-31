const Payment = require('../../models/Payment');

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email')
      .populate('serviceId', 'title price');

    // Transform to match frontend expected structure
    const transformedPayments = payments.map(payment => ({
      _id: payment._id,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      userEmail: payment.userId ? payment.userId.email : payment.customerEmail,
      serviceId: payment.serviceId ? payment.serviceId._id : payment.serviceId,
      serviceTitle: payment.serviceId ? payment.serviceId.title : (payment.serviceDetails?.title || 'N/A'),
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }));

    res.json({
      success: true,
      data: transformedPayments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('serviceId', 'title price');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
};

// Get payments by status
const getPaymentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const payments = await Payment.find({ status })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email')
      .populate('serviceId', 'title price');

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments by status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
};

// Update payment status (mainly for refunds and manual overrides)
const updatePaymentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    // Only allow refund and failed status updates since payments auto-complete
    if (!['failed', 'refunded'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Only failed and refunded status updates are allowed. Payments auto-complete.'
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Store previous status for comparison
    const previousStatus = payment.status;

    // Update payment status
    payment.status = status;

    // Add admin notes to metadata if provided
    if (notes) {
      payment.metadata = { ...payment.metadata, adminNotes: notes };
    }

    // Update timestamp if status changed and was previously not completed
    if (status === 'refunded' && previousStatus !== 'refunded') {
      payment.refundedAt = new Date();
    }

    await payment.save();

    res.json({
      success: true,
      data: payment,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment status' });
  }
};

// Get payment analytics/overview
const getPaymentAnalytics = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const totalRevenue = await Payment.aggregate([{ $match: { status: 'succeeded' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const successfulPayments = await Payment.countDocuments({ status: 'succeeded' });
    const failedPayments = await Payment.countDocuments({ status: 'failed' });
    const refundedPayments = await Payment.countDocuments({ status: 'refunded' });

    const totalRefundAmount = await Payment.aggregate([
      { $match: { status: 'refunded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingPayments,
        successfulPayments,
        failedPayments,
        refundedPayments,
        totalRefundAmount: totalRefundAmount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  getPaymentsByStatus,
  updatePaymentStatus,
  getPaymentAnalytics
};
