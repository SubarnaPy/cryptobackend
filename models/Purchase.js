const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemType: {
    type: String,
    enum: ['product', 'webinar', 'service', 'consultation'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  serviceType: {
    type: String,
    required: false // Only for service/consultation purchases
  },
  consultationDate: {
    type: Date,
    required: false // Only for consultation purchases
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // Enhanced fields for better tracking
  serviceName: {
    type: String,
    required: false // Service title for easier querying
  },
  consultationType: {
    type: String,
    required: false // Type of consultation booked
  },
  consultationStatus: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    required: false // Only for consultation purchases
  },
  revenue: {
    type: Number,
    required: false // Calculated revenue (price * quantity)
  },
  refundAmount: {
    type: Number,
    default: 0 // Amount refunded if any
  },
  notes: {
    type: String,
    required: false // Additional notes
  }
}, {
  timestamps: true
});

// Indexes for performance
purchaseSchema.index({ userId: 1, itemId: 1 });
purchaseSchema.index({ itemType: 1, status: 1 });
purchaseSchema.index({ createdAt: -1 });
purchaseSchema.index({ serviceType: 1 });
purchaseSchema.index({ consultationType: 1 });

// Pre-save middleware to calculate revenue
purchaseSchema.pre('save', function(next) {
  if (this.isModified('price') || this.isModified('quantity')) {
    this.revenue = this.price * this.quantity;
  }
  next();
});

// Static methods for analytics
purchaseSchema.statics.getServicePurchases = function() {
  return this.find({ itemType: { $in: ['service', 'consultation'] } })
    .populate('userId', 'firstName lastName email')
    .populate('paymentId', 'status amount createdAt')
    .sort({ createdAt: -1 });
};

purchaseSchema.statics.getProductPurchases = function() {
  return this.find({ itemType: { $in: ['product', 'webinar'] } })
    .populate('userId', 'firstName lastName email')
    .populate('paymentId', 'status amount createdAt')
    .sort({ createdAt: -1 });
};

purchaseSchema.statics.getRevenueByType = function(itemType) {
  return this.aggregate([
    { $match: { itemType, status: { $in: ['confirmed', 'completed'] } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue' },
        totalQuantity: { $sum: '$quantity' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Purchase', purchaseSchema);
