const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: Number,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  aboutService: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  reviews: {
    type: Number,
    required: true,
    default: 0,
  },
  consultant: {
    type: String,
    required: true,
  },
  consultantTitle: {
    type: String,
    required: true,
  },
  features: [{
    type: String,
  }],
  icon: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Service', serviceSchema);
