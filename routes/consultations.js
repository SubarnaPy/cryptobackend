const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth').verifyToken;
const { requireAdmin } = require('../middleware/auth');
const {
  optionalAuth,
  bookConsultation,
  getUserConsultations,
  getConsultationById,
  cancelConsultation,
  getAllConsultations,
  replyToConsultation,
  confirmConsultation
} = require('../controllers/user/consultationController');

// @route   POST /api/consultations
// @desc    Book a new consultation
// @access  Public
router.post('/', optionalAuth, bookConsultation);

// @route   GET /api/consultations
// @desc    Get user's consultations (requires auth)
// @access  Private
router.get('/', auth, getUserConsultations);

// @route   GET /api/consultations/:id
// @desc    Get specific consultation by ID
// @access  Private
router.get('/:id', auth, getConsultationById);

// @route   PUT /api/consultations/:id/cancel
// @desc    Cancel a consultation
// @access  Private
router.put('/:id/cancel', auth, cancelConsultation);

// Admin routes

// @route   GET /api/consultations/admin/all
// @desc    Get all consultations (admin only)
// @access  Private Admin
router.get('/admin/all', requireAdmin, getAllConsultations);

// @route   POST /api/consultations/admin/:id/reply
// @desc    Reply to consultation with meeting link (admin only)
// @access  Private Admin
router.post('/admin/:id/reply', requireAdmin, replyToConsultation);

// @route   PUT /api/consultations/admin/:id/confirm
// @desc    Confirm a consultation (admin only)
// @access  Private Admin
router.put('/admin/:id/confirm', auth, confirmConsultation);

module.exports = router;
