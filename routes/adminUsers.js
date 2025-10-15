const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private Admin
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to retrieve users'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private Admin
router.put('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User role updated',
      data: user
    });
  } catch (error) {
    console.error('❌ Update role error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update user role'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Toggle user active status
// @access  Private Admin
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      error: 'Server error',
      details: 'Failed to update user status'
    });
  }
});

module.exports = router;
