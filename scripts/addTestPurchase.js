const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

async function addTestPurchase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get first product
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found in database');
      process.exit(1);
    }

    console.log('📦 Found product:', product.title);

    // Your user ID from the logs
    const userId = '68e5482dc0f20dbdf8b3fc65';

    // Check if purchase already exists
    const existing = await Purchase.findOne({
      userId,
      itemId: product._id
    });

    if (existing) {
      console.log('✅ Purchase already exists');
    } else {
      // Create test purchase
      await Purchase.create({
        userId,
        itemType: 'product',
        itemId: product._id,
        paymentId: new mongoose.Types.ObjectId(), // Dummy payment ID
        price: parseFloat(product.price.toString().replace(/[^0-9.]/g, '')),
        quantity: 1
      });
      console.log('✅ Test purchase created!');
    }

    console.log('\n📊 Total purchases for user:', await Purchase.countDocuments({ userId }));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestPurchase();
