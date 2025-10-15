const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, referralCode } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Please provide all required fields' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email' 
      });
    }

    // Verify referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ affiliateCode: referralCode.toUpperCase() });
      if (!referrer) {
        return res.status(400).json({ 
          error: 'Invalid referral code' 
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if this is the first user (make them admin)
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      referredBy: referralCode ? referralCode.toUpperCase() : null,
    });

    // Generate unique affiliate code for the new user
    const affiliateCode = await user.generateAffiliateCode();
    user.affiliateCode = affiliateCode;

    await user.save();

    // Update referrer's stats if they referred this user
    if (referrer) {
      referrer.affiliateStats.totalReferrals += 1;
      await referrer.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        affiliateCode: user.affiliateCode,
        referredBy: user.referredBy,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Failed to create account. Please try again.' 
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        error: 'Your account has been deactivated. Please contact support.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        affiliateCode: user.affiliateCode,
        affiliateStats: user.affiliateStats,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login. Please try again.' 
    });
  }
});

// Get current user (verify token)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        affiliateCode: user.affiliateCode,
        affiliateStats: user.affiliateStats,
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Get user's affiliate information
router.get('/affiliate-info', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get referrals (users referred by this user)
    const referrals = await User.find({ referredBy: user.affiliateCode })
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 });

    res.json({
      affiliateCode: user.affiliateCode,
      affiliateStats: user.affiliateStats,
      referrals: referrals.map(ref => ({
        name: `${ref.firstName} ${ref.lastName}`,
        email: ref.email,
        joinedDate: ref.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get affiliate info error:', error);
    res.status(500).json({ error: 'Failed to get affiliate information' });
  }
});

// Check if admin exists
router.get('/check-admin', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.json({ adminExists: adminCount > 0 });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

// Become first admin (for bootstrapping)
router.post('/become-admin', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if any admin exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount > 0) {
      return res.status(400).json({ 
        error: 'An admin already exists in the system' 
      });
    }

    // Make this user an admin
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = 'admin';
    await user.save();

    // Generate new token with updated role
    const newToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'You are now an admin',
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Become admin error:', error);
    res.status(500).json({ 
      error: 'Failed to update role. Please try again.' 
    });
  }
});

module.exports = router;
