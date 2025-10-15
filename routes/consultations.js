const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const auth = require('../middleware/auth').verifyToken;
const { requireAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Middleware to authenticate requests (if user is logged in)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      req.user = await User.findOne({ _id: token.split('.')[0] }); // Simplified for demo
      // In production, you'd verify the JWT token properly
    }
    next();
  } catch (error) {
    // Continue without authentication for guest users
    next();
  }
};

// @route   POST /api/consultations
// @desc    Book a new consultation
// @access  Public
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      consultationType,
      preferredDate,
      message,
      userId
    } = req.body;

    console.log('📝 Booking consultation:', { name, email, consultationType, preferredDate });

    // Validate required fields
    if (!name || !email || !consultationType || !preferredDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Name, email, consultation type, and preferred date are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Check if preferred date is in the future
    const preferredDateObj = new Date(preferredDate);
    if (preferredDateObj < new Date()) {
      return res.status(400).json({
        error: 'Invalid date',
        details: 'Preferred date must be in the future'
      });
    }

    // No duplicate consultation limits - users can book as many consultations as they want
    // This allows multiple consultation types and follow-up consultations
    console.log('📝 Allowing multiple consultations per user/email - no duplicate limits enforced');

    // Create consultation
    const consultation = new Consultation({
      name,
      email,
      phone,
      consultationType,
      preferredDate: preferredDateObj,
      message,
      userId: req.user ? req.user._id : null,
      status: 'pending'
    });

    await consultation.save();

    console.log('✅ Consultation booked successfully:', consultation._id);

    // Populate user data if authenticated
    let consultationData = consultation.toObject();
    if (req.user) {
      consultationData.user = {
        _id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      };
    }

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully',
      data: consultationData
    });

  } catch (error) {
    console.error('❌ Consultation booking error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }

    res.status(500).json({
      error: 'Server error',
      details: 'Failed to book consultation. Please try again.'
    });
  }
});

// @route   GET /api/consultations
// @desc    Get user's consultations (requires auth)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const consultations = await Consultation.find({
      userId: req.user._id
    })
    .sort({ createdAt: -1 })
    .populate('assignedConsultant', 'firstName lastName email')
    .select('-__v');

    res.json({
      success: true,
      data: consultations,
      count: consultations.length
    });

  } catch (error) {
    console.error('❌ Get consultations error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to retrieve consultations'
    });
  }
});

// @route   GET /api/consultations/:id
// @desc    Get specific consultation by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
    .populate('assignedConsultant', 'firstName lastName email')
    .select('-__v');

    if (!consultation) {
      return res.status(404).json({
        error: 'Consultation not found'
      });
    }

    res.json({
      success: true,
      data: consultation
    });

  } catch (error) {
    console.error('❌ Get consultation error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to retrieve consultation'
    });
  }
});

// @route   PUT /api/consultations/:id/cancel
// @desc    Cancel a consultation
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (!consultation) {
      return res.status(404).json({
        error: 'Consultation not found or cannot be cancelled'
      });
    }

    const { reason } = req.body;
    await consultation.cancelBooking(reason);

    res.json({
      success: true,
      message: 'Consultation cancelled successfully',
      data: consultation
    });

  } catch (error) {
    console.error('❌ Cancel consultation error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to cancel consultation'
    });
  }
});

// Admin routes

// @route   GET /api/consultations/admin/all
// @desc    Get all consultations (admin only)
// @access  Private Admin
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const consultations = await Consultation.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email')
      .populate('assignedConsultant', 'firstName lastName email');

    res.json({
      success: true,
      data: consultations,
      count: consultations.length
    });
  } catch (error) {
    console.error('❌ Get all consultations error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to retrieve consultations'
    });
  }
});

// @route   POST /api/consultations/admin/:id/reply
// @desc    Reply to consultation with meeting link (admin only)
// @access  Private Admin
router.post('/admin/:id/reply', requireAdmin, async (req, res) => {
  try {
    const { meetingLink, scheduledDate, message } = req.body;

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Update consultation
    consultation.status = 'confirmed';
    consultation.scheduledDate = new Date(scheduledDate);
    consultation.notes = message;
    await consultation.save();

    // Send email
    await emailService.sendConsultationReply({
      to: consultation.email,
      name: consultation.name,
      consultationType: consultation.consultationType,
      meetingLink,
      scheduledDate,
      message
    });

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: consultation
    });
  } catch (error) {
    console.error('❌ Send reply error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to send reply'
    });
  }
});

// @route   PUT /api/consultations/admin/:id/confirm
// @desc    Confirm a consultation (admin only)
// @access  Private Admin
router.put('/admin/:id/confirm', auth, async (req, res) => {
  // In production, add admin check: if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  try {
    const { scheduledDate, assignedConsultant, meetingType } = req.body;

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        error: 'Consultation not found'
      });
    }

    if (consultation.status !== 'pending') {
      return res.status(400).json({
        error: 'Consultation already processed'
      });
    }

    await consultation.confirmBooking(new Date(scheduledDate), assignedConsultant, meetingType);

    // Populate assigned consultant data
    await consultation.populate('assignedConsultant', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Consultation confirmed successfully',
      data: consultation
    });

  } catch (error) {
    console.error('❌ Confirm consultation error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to confirm consultation'
    });
  }
});

module.exports = router;
