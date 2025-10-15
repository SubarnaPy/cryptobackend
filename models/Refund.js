const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  serviceId: {
    type: Number,
    required: true,
  },
  refundReason: {
    type: String,
    required: true,
    trim: true,
  },
  refundAmount: {
    type: Number, // in cents
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: 'usd',
  },
  stripeRefundId: {
    type: String,
    sparse: true, // Allow null values but ensure uniqueness when present
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'succeeded', 'failed'],
    default: 'pending',
  },
  statusReason: {
    type: String,
    trim: true,
  },
  adminApproval: {
    approved: {
      type: Boolean,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    reviewNotes: {
      type: String,
      trim: true,
    },
  },
  serviceDetails: {
    title: String,
    consultant: String,
    originalPaymentAmount: Number,
  },
  refundRequestedAt: {
    type: Date,
    default: Date.now,
  },
  refundProcessedAt: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Index for faster queries
refundSchema.index({ userId: 1, status: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ stripeRefundId: 1 }, { sparse: true });

module.exports = mongoose.model('Refund', refundSchema);
