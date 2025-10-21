const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const listCollections = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/canada_admin');
    
    console.log('Connected to MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\nAll collections in database:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check purchases collection
    const Purchase = require('../models/Purchase');
    const purchaseCount = await Purchase.countDocuments();
    console.log(`\nPurchases collection has ${purchaseCount} documents`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

listCollections();
