const Purchase = require('../../models/Purchase');
const Product = require('../../models/Product');
const Webinar = require('../../models/Webinar');

// Get user's purchased webinars
const getUserPurchasedWebinars = async (req, res) => {
  try {
    console.log('Fetching webinars for user:', req.user._id);

    // Find only webinar purchases
    const purchases = await Purchase.find({
      userId: req.user._id,
      itemType: 'webinar'
    }).sort({ createdAt: -1 });
    console.log('Found webinar purchases:', purchases.length);

    // Get webinar details
    const purchasedWebinars = await Promise.all(
      purchases.map(async (purchase) => {
        const webinar = await Webinar.findById(purchase.itemId);

        if (webinar) {
          return {
            _id: webinar._id,
            title: webinar.title,
            description: webinar.description,
            type: 'webinar',
            price: webinar.price,
            purchaseDate: purchase.createdAt,
            coverImage: webinar.thumbnail,
            date: webinar.date,
            time: webinar.time
          };
        }
        return null;
      })
    );

    // Filter out null values
    const validWebinars = purchasedWebinars.filter(item => item !== null);
    console.log('Valid webinars:', validWebinars.length);

    res.json({
      success: true,
      data: validWebinars
    });
  } catch (error) {
    console.error('Error fetching purchased webinars:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchased webinars',
      error: error.message
    });
  }
};

// Get user's purchased products
const getUserPurchasedProducts = async (req, res) => {
  try {
    console.log('Fetching products for user:', req.user._id);

    // Find only product purchases (not webinars or service bookings)
    const purchases = await Purchase.find({
      userId: req.user._id,
      itemType: 'product'
    }).sort({ createdAt: -1 });
    console.log('Found purchases:', purchases.length);

    // Get product details
    const purchasedProducts = await Promise.all(
      purchases.map(async (purchase) => {
        const product = await Product.findById(purchase.itemId);

        if (product) {
          return {
            _id: product._id,
            title: product.title,
            description: product.description,
            type: 'product',
            price: product.price,
            purchaseDate: purchase.createdAt,
            coverImage: product.coverImage
          };
        }
        return null;
      })
    );

    // Filter out null values
    const validProducts = purchasedProducts.filter(item => item !== null);
    console.log('Valid products:', validProducts.length);

    res.json({
      success: true,
      data: validProducts
    });
  } catch (error) {
    console.error('Error fetching purchased products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchased products',
      error: error.message
    });
  }
};

module.exports = {
  getUserPurchasedWebinars,
  getUserPurchasedProducts
};
