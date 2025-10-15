const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  affiliateCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
  },
  referredBy: {
    type: String, // Stores the affiliate code of the referrer
    uppercase: true,
  },
  affiliateStats: {
    totalReferrals: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingEarnings: {
      type: Number,
      default: 0,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate unique 8-digit affiliate code
userSchema.methods.generateAffiliateCode = async function() {
  const crypto = require('crypto');
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate random 8-character alphanumeric code
    code = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 8);
    
    // Check if code already exists
    const existingUser = await mongoose.model('User').findOne({ affiliateCode: code });
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return code;
};

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
