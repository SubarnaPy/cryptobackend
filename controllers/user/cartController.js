const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const Webinar = require('../../models/Webinar');

// Get user's cart
const getUserCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Populate item details
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        let itemDetails;
        if (item.itemType === 'product') {
          itemDetails = await Product.findById(item.itemId);
        } else {
          itemDetails = await Webinar.findById(item.itemId);
        }
        return {
          ...item.toObject(),
          details: itemDetails
        };
      })
    );

    res.json({
      success: true,
      data: {
        ...cart.toObject(),
        items: populatedItems
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add item to cart
const addItemToCart = async (req, res) => {
  try {
    console.log('Add to cart request:', req.body);
    const { itemType, itemId, quantity = 1 } = req.body;

    if (!itemType || !itemId) {
      console.log('Missing required fields:', { itemType, itemId });
      return res.status(400).json({ success: false, message: 'itemType and itemId are required' });
    }

    // Validate item exists and get price
    let item, price;
    if (itemType === 'product') {
      item = await Product.findById(itemId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      price = parseFloat(item.price.toString().replace(/[^0-9.]/g, ''));
    } else if (itemType === 'webinar') {
      item = await Webinar.findById(itemId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Webinar not found' });
      }
      price = parseFloat(item.price.toString().replace(/[^0-9.]/g, ''));
    } else {
      return res.status(400).json({ success: false, message: 'Invalid item type' });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Check if item already in cart
    const existingItem = cart.items.find(
      i => i.itemId.toString() === itemId && i.itemType === itemType
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ itemType, itemId, quantity, price });
    }

    await cart.save();

    res.json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    item.quantity = quantity;
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove item from cart
const removeCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
