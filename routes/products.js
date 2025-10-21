const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../services/cloudinaryService');

// @route   GET /api/products
// @desc    Get all active products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Admin routes

// @route   GET /api/products/admin/all
// @desc    Get all products (admin)
// @access  Private Admin
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// @route   POST /api/products/admin
// @desc    Create a product (admin)
// @access  Private Admin
router.post('/admin', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const productData = req.body;
    
    // Add image URL if uploaded
    if (req.file) {
      productData.coverImage = req.file.path;
      productData.thumbnail = req.file.path;
    }
    
    const product = new Product(productData);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// @route   PUT /api/products/admin/:id
// @desc    Update a product (admin)
// @access  Private Admin
router.put('/admin/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const updateData = req.body;
    
    // Add image URL if uploaded
    if (req.file) {
      updateData.coverImage = req.file.path;
      updateData.thumbnail = req.file.path;
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// @route   DELETE /api/products/admin/:id
// @desc    Delete a product (admin)
// @access  Private Admin
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
