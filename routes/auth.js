const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// Configure SendGrid (only if API key is available)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('⚠️  SENDGRID_API_KEY not set - email OTP will be logged to console only');
}

// Configure Twilio (only if credentials are available)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn('⚠️  TWILIO credentials not set - SMS OTP will not be available');
}

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email
async function sendOTPEmail(email, otp) {
  try {
    console.log('🔑 OTP for', email, ':', otp);
    console.log('Sending email...');
    console.log('To:', email);
    console.log('From:', process.env.SENDGRID_FROM_EMAIL);
    console.log('API Key set:', !!process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Your OTP for Canadian Nexus',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F0B90B;">Welcome to Canadian Nexus!</h2>
          <p>Your OTP code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #333; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    const info = await sgMail.send(msg);
    console.log('📧 Email sent successfully to', email);
    return info;
  } catch (error) {
    console.error('SendGrid Error Details:', error.response?.body || error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    throw error;
  }
}

// Send OTP via SMS
async function sendOTPSMS(phone, otp) {
  if (!twilioClient) {
    console.log(`📱 DEVELOPMENT SMS OTP for ${phone}: ${otp}`);
    console.log('💬 In production, this would be sent via Twilio');
    return;
  }

  await twilioClient.messages.create({
    body: `Your Canadian Nexus OTP: ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}

// Send OTP Route
router.post('/send-otp', async (req, res) => {
  try {
    const { contact } = req.body; // email or phone
    
    if (!contact) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: contact }, { phone: contact }]
    });

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP with user info
    otpStore.set(contact, {
      otp,
      expiresAt,
      isExistingUser: !!existingUser,
      userId: existingUser?._id
    });

    // Send OTP via email or SMS
    if (contact.includes('@')) {
      await sendOTPEmail(contact, otp);
    } else {
      await sendOTPSMS(contact, otp);
    }

    res.json({
      message: existingUser ? 'OTP sent for login' : 'OTP sent for registration',
      isExistingUser: !!existingUser
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and Create User/Login Route
router.post('/verify-otp', async (req, res) => {
  try {
    const { contact, otp } = req.body;

    if (!contact || !otp) {
      return res.status(400).json({ error: 'Contact and OTP are required' });
    }

    // Check OTP
    const storedOTP = otpStore.get(contact);
    if (!storedOTP) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(contact);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Clean up OTP
    otpStore.delete(contact);

    // Check if this is for an existing user
    if (storedOTP.isExistingUser && storedOTP.userId) {
      // Existing user login
      const user = await User.findById(storedOTP.userId);
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          needsProfileUpdate: false,
        },
      });
    }

    // New user registration
    // Create user with dummy password
    const dummyPassword = 'User123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dummyPassword, salt);

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const userData = {
      password: hashedPassword,
      role,
      firstName: 'User',
      lastName: 'Name',
    };

    // Set email or phone
    if (contact.includes('@')) {
      userData.email = contact;
    } else {
      userData.phone = contact;
    }

    const user = new User(userData);
    const affiliateCode = await user.generateAffiliateCode();
    user.affiliateCode = affiliateCode;

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        needsProfileUpdate: true,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

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

// Update user profile
router.put('/update-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { firstName, lastName, email, phone, password } = req.body;

    // Check email uniqueness if updating email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Clear profile update flag if profile is now complete
    if (firstName && lastName && (email || phone)) {
      user.needsProfileUpdate = false;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
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
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
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
