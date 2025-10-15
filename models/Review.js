const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  date: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  serviceId: {
    type: Number,
    ref: 'Service',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Review', reviewSchema);
