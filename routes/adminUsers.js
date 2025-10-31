const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const {
  getAllUsers,
  updateUserRole,
  toggleUserStatus
} = require('../controllers/admin/userController');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private Admin
router.get('/', requireAdmin, getAllUsers);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private Admin
router.put('/:id/role', requireAdmin, updateUserRole);

// @route   PUT /api/admin/users/:id/status
// @desc    Toggle user active status
// @access  Private Admin
router.put('/:id/status', requireAdmin, toggleUserStatus);

module.exports = router;
