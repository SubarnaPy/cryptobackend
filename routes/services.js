const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getAllReviews,
  getServicesByCategory,
  getServiceReviews,
  getServiceById
} = require('../controllers/user/serviceController');

// @route   GET /api/services
// @desc    Get all services
// @access  Public
router.get('/', getAllServices);

// @route   GET /api/services/all/reviews
// @desc    Get all reviews
// @access  Public
// NOTE: This route MUST be before /:id to avoid matching "all" as an ID
router.get('/all/reviews', getAllReviews);

// @route   GET /api/services/category/:category
// @desc    Get services by category
// @access  Public
// NOTE: This route MUST be before /:id to avoid matching "category" as an ID
router.get('/category/:category', getServicesByCategory);

// @route   GET /api/services/:id/reviews
// @desc    Get reviews for a specific service
// @access  Public
router.get('/:id/reviews', getServiceReviews);

// @route   GET /api/services/:id
// @desc    Get single service by serviceId
// @access  Public
// NOTE: This route should be LAST among GET routes to avoid matching specific paths
router.get('/:id', getServiceById);

module.exports = router;
