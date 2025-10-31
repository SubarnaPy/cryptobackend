const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getUserPurchasedWebinars,
  getUserPurchasedProducts
} = require('../controllers/user/userProductsController');

// Get user's purchased webinars
router.get('/my-webinars', verifyToken, getUserPurchasedWebinars);

// Get user's purchased products
router.get('/my-products', verifyToken, getUserPurchasedProducts);

module.exports = router;
