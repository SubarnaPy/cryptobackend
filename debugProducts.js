const mongoose = require('mongoose');
const Product = require('./models/Product');
const Purchase = require('./models/Purchase');
const Payment = require('./models/Payment');

async function debugProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/canadian_nexus', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🔍 Checking products and purchases...');

    // Get all products
    const products = await Product.find({});
    console.log(`📊 Total products: ${products.length}`);

    // Show product structure
    if (products.length > 0) {
      console.log('📝 Product fields:', Object.keys(products[0].toObject()));
      console.log('📝 Sample product:', {
        _id: products[0]._id,
        name: products[0].name,
        title: products[0].title,
        price: products[0].price
      });
    }

    // Get product purchases
    const purchases = await Purchase.find({ itemType: 'product' });
    console.log(`🛒 Total product purchases: ${purchases.length}`);

    // Show purchase structure
    if (purchases.length > 0) {
      console.log('📝 Purchase fields:', Object.keys(purchases[0].toObject()));
      console.log('📝 Sample purchase:', {
        _id: purchases[0]._id,
        itemId: purchases[0].itemId,
        itemType: purchases[0].itemType,
        paymentId: purchases[0].paymentId,
        customerName: purchases[0].customerName
      });
    }

    // Check payments
    const payments = await Payment.find({});
    console.log(`💳 Total payments: ${payments.length}`);

    if (payments.length > 0) {
      console.log('📝 Payment fields:', Object.keys(payments[0].toObject()));
      console.log('📝 Sample payment:', {
        _id: payments[0]._id,
        status: payments[0].status,
        amount: payments[0].amount
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugProducts();