const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Service = require('../models/Service');

async function removeServiceIdField() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Removing serviceId field from all services...');
    
    const result = await Service.updateMany(
      {},
      { $unset: { serviceId: "" } }
    );

    console.log(`✅ Updated ${result.modifiedCount} services`);
    console.log(`📝 Matched ${result.matchedCount} documents`);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

removeServiceIdField();
