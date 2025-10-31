const Webinar = require('../../models/Webinar');

// Get user's registered webinars
const getUserRegisteredWebinars = async (req, res) => {
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
};

// Get all upcoming webinars
const getAllUpcomingWebinars = async (req, res) => {
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
};

// Register for a webinar
const registerForWebinar = async (req, res) => {
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
};

// Get all webinars (admin)
const getAllWebinarsAdmin = async (req, res) => {
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
};

// Create a webinar (admin)
const createWebinar = async (req, res) => {
  try {
    const webinar = new Webinar(req.body);
    await webinar.save();
    res.status(201).json({ success: true, data: webinar });
  } catch (error) {
    console.error('Error creating webinar:', error);
    res.status(500).json({ error: 'Failed to create webinar' });
  }
};

// Update a webinar (admin)
const updateWebinar = async (req, res) => {
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
};

// Delete a webinar (admin)
const deleteWebinar = async (req, res) => {
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
};

// Get webinar registrations (admin)
const getWebinarRegistrations = async (req, res) => {
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
};

// Remove user from webinar registration (admin)
const removeUserFromWebinar = async (req, res) => {
  try {
    const { webinarId, email } = req.params;

    const webinar = await Webinar.findById(webinarId);

    if (!webinar) {
      return res.status(404).json({ error: 'Webinar not found' });
    }

    // Find and remove the registration
    const registrationIndex = webinar.registrations.findIndex(
      reg => reg.email.toLowerCase() === email.toLowerCase()
    );

    if (registrationIndex === -1) {
      return res.status(404).json({ error: 'User not registered for this webinar' });
    }

    webinar.registrations.splice(registrationIndex, 1);
    await webinar.save();

    res.json({ success: true, message: 'User removed from webinar successfully' });
  } catch (error) {
    console.error('Error removing user from webinar:', error);
    res.status(500).json({ error: 'Failed to remove user from webinar' });
  }
};

module.exports = {
  getUserRegisteredWebinars,
  getAllUpcomingWebinars,
  registerForWebinar,
  getAllWebinarsAdmin,
  createWebinar,
  updateWebinar,
  deleteWebinar,
  getWebinarRegistrations,
  removeUserFromWebinar
};
