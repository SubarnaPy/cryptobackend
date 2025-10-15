const mongoose = require('mongoose');

// Consultation Booking Model
const consultationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  consultationType: {
    type: String,
    required: [true, 'Consultation type is required'],
    enum: {
      values: ['immigration', 'settlement', 'job-search', 'legal', 'education', 'business', 'general'],
      message: 'Invalid consultation type'
    }
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required'],
    validate: {
      validator: function(value) {
        return value >= new Date();
      },
      message: 'Preferred date must be in the future'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedConsultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  scheduledDate: {
    type: Date
  },
  meetingType: {
    type: String,
    enum: ['phone', 'video', 'in-person'],
    default: 'video'
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: 15,
    max: 60
  },
  followUpSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
consultationSchema.index({ email: 1 });
consultationSchema.index({ userId: 1 });
consultationSchema.index({ status: 1 });
consultationSchema.index({ preferredDate: 1 });
consultationSchema.index({ createdAt: -1 });

// Virtual for formatted date
consultationSchema.virtual('formattedPreferredDate').get(function() {
  return this.preferredDate ? this.preferredDate.toLocaleDateString('en-CA') : null;
});

consultationSchema.virtual('formattedScheduledDate').get(function() {
  return this.scheduledDate ? this.scheduledDate.toLocaleDateString('en-CA') : null;
});

// Pre-save middleware to update updatedAt
consultationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
consultationSchema.methods.confirmBooking = function(scheduledDate, assignedConsultant, meetingType = 'video') {
  this.status = 'confirmed';
  this.scheduledDate = scheduledDate;
  this.assignedConsultant = assignedConsultant;
  this.meetingType = meetingType;
  return this.save();
};

consultationSchema.methods.cancelBooking = function(reason) {
  this.status = 'cancelled';
  this.notes = reason ? `${this.notes ? this.notes + '. ' : ''}Cancelled: ${reason}` : this.notes;
  return this.save();
};

consultationSchema.methods.markCompleted = function() {
  this.status = 'completed';
  return this.save();
};

// Static methods
consultationSchema.statics.getPendingConsultations = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

consultationSchema.statics.getUserConsultations = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

consultationSchema.statics.getConsultationsByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

consultationSchema.statics.getUpcomingConsultations = function() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return this.find({
    scheduledDate: { $gte: tomorrow },
    status: 'confirmed'
  }).sort({ scheduledDate: 1 });
};

module.exports = mongoose.model('Consultation', consultationSchema);
