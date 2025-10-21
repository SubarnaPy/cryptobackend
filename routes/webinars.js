const express = require('express');
const router = express.Router();
const Webinar = require('../models/Webinar');
const { requireAdmin, verifyToken } = require('../middleware/auth');

// @route   GET /api/webinars/my-registrations
// @desc    Get user's registered webinars
// @access  Private
router.get('/my-registrations', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const webinars = await Webinar.find({
      'registrations.email': userEmail.toLowerCase()
    }).select('-registrations');

    res.json({ success: true, data: webinars });
  } catch (error) {
    console.error('Error fetching user webinars:', error);
    res.status(500).json({ error: 'Failed to fetch webinars' });
  }
});

// @route   GET /api/webinars
// @desc    Get all upcoming webinars
// @access  Public
router.get('/', async (req, res) => {
  try {
    const webinars = await Webinar.find({ status: 'upcoming' })
      .sort({ date: 1 })
      .select('-registrations');

    const webinarsWithCount = webinars.map(webinar => ({
      ...webinar.toObject(),
      registration_count: 0
    }));

    res.json({ success: true, data: webinarsWithCount });
  } catch (error) {
    console.error('Error fetching webinars:', error);
    res.status(500).json({ error: 'Failed to fetch webinars' });
  }
});

// @route   POST /api/webinars/:id/register
// @desc    Register for a webinar
// @access  Public
router.post('/:id/register', async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;
    
    console.log('Registration request:', { id: req.params.id, name, email });

    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid webinar ID' });
    }

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const webinar = await Webinar.findById(req.params.id);
    if (!webinar) {
      console.log('Webinar not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Webinar not found' });
    }

    // Check if already registered
    const alreadyRegistered = webinar.registrations.some(
      reg => reg.email.toLowerCase() === email.toLowerCase()
    );

    if (alreadyRegistered) {
      return res.status(400).json({ error: 'Already registered for this webinar' });
    }

    // Check if full
    if (webinar.max_attendees && webinar.registrations.length >= webinar.max_attendees) {
      return res.status(400).json({ error: 'Webinar is full' });
    }

    webinar.registrations.push({
      name,
      email: email.toLowerCase(),
      phone,
      company
    });

    await webinar.save();

    res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Error registering for webinar:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Admin routes

// @route   GET /api/webinars/admin/all
// @desc    Get all webinars (admin)
// @access  Private Admin
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const webinars = await Webinar.find().sort({ date: -1 });
    
    const webinarsWithCount = webinars.map(webinar => ({
      ...webinar.toObject(),
      registration_count: webinar.registrations.length
    }));

    res.json({ success: true, data: webinarsWithCount });
  } catch (error) {
    console.error('Error fetching webinars:', error);
    res.status(500).json({ error: 'Failed to fetch webinars' });
  }
});

// @route   POST /api/webinars/admin
// @desc    Create a webinar (admin)
// @access  Private Admin
router.post('/admin', requireAdmin, async (req, res) => {
  try {
    const webinar = new Webinar(req.body);
    await webinar.save();
    res.status(201).json({ success: true, data: webinar });
  } catch (error) {
    console.error('Error creating webinar:', error);
    res.status(500).json({ error: 'Failed to create webinar' });
  }
});

// @route   PUT /api/webinars/admin/:id
// @desc    Update a webinar (admin)
// @access  Private Admin
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const webinar = await Webinar.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    res.json({ success: true, data: webinar });
  } catch (error) {
    console.error('Error updating webinar:', error);
    res.status(500).json({ error: 'Failed to update webinar' });
  }
});

// @route   DELETE /api/webinars/admin/:id
// @desc    Delete a webinar (admin)
// @access  Private Admin
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const webinar = await Webinar.findByIdAndDelete(req.params.id);

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    res.json({ success: true, message: 'Webinar deleted' });
  } catch (error) {
    console.error('Error deleting webinar:', error);
    res.status(500).json({ error: 'Failed to delete webinar' });
  }
});

// @route   GET /api/webinars/admin/:id/registrations
// @desc    Get webinar registrations (admin)
// @access  Private Admin
router.get('/admin/:id/registrations', requireAdmin, async (req, res) => {
  try {
    const webinar = await Webinar.findById(req.params.id).select('registrations title');

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    res.json({ success: true, data: webinar.registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

module.exports = router;
