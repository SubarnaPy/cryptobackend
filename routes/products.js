const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../services/cloudinaryService');
const {
  getAllProducts,
  getProductById,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/user/productController');

// @route   GET /api/products
// @desc    Get all active products
// @access  Public
router.get('/', getAllProducts);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', getProductById);

// Admin routes

// @route   GET /api/products/admin/all
// @desc    Get all products (admin)
// @access  Private Admin
router.get('/admin/all', requireAdmin, getAllProductsAdmin);

// @route   POST /api/products/admin
// @desc    Create a product (admin)
// @access  Private Admin
router.post('/admin', requireAdmin, upload.single('image'), createProduct);

// @route   PUT /api/products/admin/:id
// @desc    Update a product (admin)
// @access  Private Admin
router.put('/admin/:id', requireAdmin, upload.single('image'), updateProduct);

// @route   DELETE /api/products/admin/:id
// @desc    Delete a product (admin)
// @access  Private Admin
router.delete('/admin/:id', requireAdmin, deleteProduct);

module.exports = router;
