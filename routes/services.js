const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const Review = require('../models/Review');

// @route   GET /api/services
// @desc    Get all services
// @access  Public
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ serviceId: 1 });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/services/all/reviews
// @desc    Get all reviews
// @access  Public
// NOTE: This route MUST be before /:id to avoid matching "all" as an ID
router.get('/all/reviews', async (req, res) => {
  try {
    console.log('📥 Fetching all reviews...');
    const reviews = await Review.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${reviews.length} reviews`);
    res.json(reviews);
  } catch (error) {
    console.error('❌ Error fetching all reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/services/category/:category
// @desc    Get services by category
// @access  Public
// NOTE: This route MUST be before /:id to avoid matching "category" as an ID
router.get('/category/:category', async (req, res) => {
  try {
    const services = await Service.find({ category: req.params.category }).sort({ serviceId: 1 });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/services/:id/reviews
// @desc    Get reviews for a specific service
// @access  Public
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.id });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/services/:id
// @desc    Get single service by serviceId
// @access  Public
// NOTE: This route should be LAST among GET routes to avoid matching specific paths
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.id });
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
