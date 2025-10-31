const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getUserCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require('../controllers/user/cartController');

// Get user's cart
router.get('/', verifyToken, getUserCart);

// Add item to cart
router.post('/add', verifyToken, addItemToCart);

// Update cart item quantity
router.put('/update/:itemId', verifyToken, updateCartItem);

// Remove item from cart
router.delete('/remove/:itemId', verifyToken, removeCartItem);

// Clear cart
router.delete('/clear', verifyToken, clearCart);

module.exports = router;
