const mongoose = require('mongoose');
const Purchase = require('./models/Purchase');
const Service = require('./models/Service');

async function checkPurchases() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus');
    console.log('Connected to MongoDB');

    // Get recent purchases
    const purchases = await Purchase.find({ itemType: 'service' })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('Recent service purchases:', purchases.length);
    for (const purchase of purchases) {
      console.log('Purchase:', {
        id: purchase._id,
        itemId: purchase.itemId,
        serviceName: purchase.serviceName,
        status: purchase.status,
        user: purchase.userId ? `${purchase.userId.firstName} ${purchase.userId.lastName}` : 'Unknown',
        createdAt: purchase.createdAt
      });

      // Try to find the service
      const service = await Service.findById(purchase.itemId);
      if (service) {
        console.log('  -> Service found:', {
          title: service.title,
          category: service.category,
          price: service.price
        });
      } else {
        console.log('  -> Service NOT found for itemId:', purchase.itemId);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPurchases();
