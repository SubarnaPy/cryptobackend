const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  type: {
    type: String,
    enum: ['ebook', 'course'],
    required: true
  },
  coverImage: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  },
  salesCount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'general'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
