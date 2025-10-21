const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId for single service or null for cart
    required: false,
  },
  stripePaymentIntentId: {
    type: String,
    required: false,
    sparse: true,
  },
  stripeCheckoutSessionId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number, // in cents
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: 'usd',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  serviceDetails: {
    type: mongoose.Schema.Types.Mixed, // Flexible to handle single service or cart items
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  stripeMetadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Index for faster queries
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
