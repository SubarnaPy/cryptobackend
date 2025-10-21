const mongoose = require('mongoose');

const webinarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration_minutes: {
    type: Number,
    required: true
  },
  speaker_name: {
    type: String,
    required: true
  },
  speaker_title: {
    type: String,
    required: true
  },
  speaker_image: {
    type: String,
    default: null
  },
  cover_image: {
    type: String,
    default: null
  },
  max_attendees: {
    type: Number,
    default: null
  },
  price: {
    type: Number,
    default: 0
  },
  is_free: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  registrations: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    company: String,
    registered_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

webinarSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Webinar', webinarSchema);
