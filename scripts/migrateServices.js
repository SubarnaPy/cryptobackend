const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

async function migrateServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove serviceId field from all services
    const result = await Service.updateMany(
      {},
      { $unset: { serviceId: "" } }
    );

    console.log(`✅ Migration completed`);
    console.log(`   Modified ${result.modifiedCount} services`);
    console.log(`   Matched ${result.matchedCount} services`);

    // Display all services
    const services = await Service.find().select('_id title category');
    console.log('\n📋 Current services:');
    services.forEach(service => {
      console.log(`   - ${service.title} (ID: ${service._id})`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error migrating services:', error);
    process.exit(1);
  }
}

migrateServices();
