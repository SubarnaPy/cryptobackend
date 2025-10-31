const express = require('express');
const router = express.Router();
const { requireAdmin, verifyToken } = require('../middleware/auth');
const {
  getUserRegisteredWebinars,
  getAllUpcomingWebinars,
  registerForWebinar,
  getAllWebinarsAdmin,
  createWebinar,
  updateWebinar,
  deleteWebinar,
  getWebinarRegistrations,
  removeUserFromWebinar
} = require('../controllers/user/webinarController');

// @route   GET /api/webinars/my-registrations
// @desc    Get user's registered webinars
// @access  Private
router.get('/my-registrations', verifyToken, getUserRegisteredWebinars);

// @route   GET /api/webinars
// @desc    Get all upcoming webinars
// @access  Public
router.get('/', getAllUpcomingWebinars);

// @route   POST /api/webinars/:id/register
// @desc    Register for a webinar
// @access  Public
router.post('/:id/register', registerForWebinar);

// Admin routes

// @route   GET /api/webinars/admin/all
// @desc    Get all webinars (admin)
// @access  Private Admin
router.get('/admin/all', requireAdmin, getAllWebinarsAdmin);

// @route   POST /api/webinars/admin
// @desc    Create a webinar (admin)
// @access  Private Admin
router.post('/admin', requireAdmin, createWebinar);

// @route   PUT /api/webinars/admin/:id
// @desc    Update a webinar (admin)
// @access  Private Admin
router.put('/admin/:id', requireAdmin, updateWebinar);

// @route   DELETE /api/webinars/admin/:id
// @desc    Delete a webinar (admin)
// @access  Private Admin
router.delete('/admin/:id', requireAdmin, deleteWebinar);

// @route   GET /api/webinars/admin/:id/registrations
// @desc    Get webinar registrations (admin)
// @access  Private Admin
router.get('/admin/:id/registrations', requireAdmin, getWebinarRegistrations);

// @route   DELETE /api/webinars/admin/:webinarId/remove-user/:email
// @desc    Remove user from webinar registration (admin)
// @access  Private Admin
router.delete('/admin/:webinarId/remove-user/:email', requireAdmin, removeUserFromWebinar);

module.exports = router;
