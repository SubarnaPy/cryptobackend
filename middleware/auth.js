const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  console.log('🔒 AUTH MIDDLEWARE DEBUG:');
  console.log('- URL:', req.method, req.url);

  try {
    const authHeader = req.headers.authorization;
    console.log('- Authorization header present:', !!authHeader);

    if (authHeader) {
      console.log('- Auth header starts with Bearer:', authHeader.startsWith('Bearer '));
    }

    const token = authHeader?.replace('Bearer ', '');
    console.log('- Token extracted:', !!token);
    console.log('- Token length:', token?.length || 0);

    if (!token) {
      console.log('❌ ERROR: No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('Verifying JWT token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT verification successful');
    console.log('- User ID from token:', decoded.userId);

    console.log('Looking up user in database...');
    const user = await User.findById(decoded.userId).select('-password');
    console.log('- User found:', !!user);

    if (user) {
      console.log('- User details:', {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    }

    if (!user) {
      console.log('❌ ERROR: User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    console.log('✅ Auth successful, proceeding to route');
    next();
  } catch (error) {
    console.log('❌ ERROR: Token verification failed');
    console.log('- Error name:', error.name);
    console.log('- Error message:', error.message);

    if (error.name === 'TokenExpiredError') {
      console.log('- Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('- Invalid token format');
    } else if (error.name === 'NotBeforeError') {
      console.log('- Token not active yet');
    }

    return res.status(401).json({
      error: 'Invalid or expired token',
      debug: {
        errorType: error.name,
        message: error.message,
      }
    });
  }
  console.log(''); // Empty line for readability
};

// Middleware to check if user is admin
exports.requireAdmin = async (req, res, next) => {
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

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Legacy middleware alias for backward compatibility
exports.isAdmin = exports.requireAdmin;
