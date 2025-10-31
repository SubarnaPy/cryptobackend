const Service = require('../../models/Service');
const Review = require('../../models/Review');

// Get all services
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reviews
const getAllReviews = async (req, res) => {
  try {
    console.log('📥 Fetching all reviews...');
    const reviews = await Review.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${reviews.length} reviews`);
    res.json(reviews);
  } catch (error) {
    console.error('❌ Error fetching all reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get services by category
const getServicesByCategory = async (req, res) => {
  try {
    const services = await Service.find({ category: req.params.category }).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reviews for a specific service
const getServiceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.id });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single service by ID
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllServices,
  getAllReviews,
  getServicesByCategory,
  getServiceReviews,
  getServiceById
};