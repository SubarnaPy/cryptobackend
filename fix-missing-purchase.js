const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('./models/Payment');
const Purchase = require('./models/Purchase');

async function fixMissingPurchases() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the specific payment
    const payment = await Payment.findById('68f7594c07b20c0084dcac36');
    
    if (!payment) {
      console.log('Payment not found');
      return;
    }

    console.log('Found payment:', payment._id);
    console.log('Items:', payment.serviceDetails.items);

    // Create Purchase records for each item
    for (const item of payment.serviceDetails.items) {
      const existingPurchase = await Purchase.findOne({
        userId: payment.userId,
        itemId: item.itemId,
        itemType: item.itemType
      });

      if (!existingPurchase) {
        const purchase = await Purchase.create({
          userId: payment.userId,
          itemType: item.itemType,
          itemId: item.itemId,
          paymentId: payment._id,
          price: item.price || 0,
          quantity: item.quantity || 1
        });
        console.log(`✅ Created purchase record: ${purchase._id}`);
      } else {
        console.log(`Purchase already exists for ${item.itemType}: ${item.itemId}`);
      }
    }

    console.log('✅ Fix completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixMissingPurchases();