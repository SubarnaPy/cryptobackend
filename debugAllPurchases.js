const mongoose = require('mongoose');
const Purchase = require('./models/Purchase');

async function debugAllPurchases() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/canadian_nexus', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🔍 Checking all purchases in database...');

    // Get all purchases
    const allPurchases = await Purchase.find({});
    console.log(`📊 Total purchases: ${allPurchases.length}`);

    // Group by itemType
    const itemTypes = {};
    allPurchases.forEach(purchase => {
      const type = purchase.itemType || 'null/undefined';
      itemTypes[type] = (itemTypes[type] || 0) + 1;
    });

    console.log('📈 Purchase types:');
    Object.entries(itemTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} purchases`);
    });

    // Show sample purchases
    if (allPurchases.length > 0) {
      console.log('📝 Sample purchases:');
      allPurchases.slice(0, 3).forEach((purchase, index) => {
        console.log(`${index + 1}. Type: ${purchase.itemType}, ItemId: ${purchase.itemId}, PaymentId: ${purchase.paymentId}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugAllPurchases();