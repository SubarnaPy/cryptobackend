const mongoose = require('mongoose');
const Service = require('./models/Service');

async function checkServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus');
    console.log('Connected to MongoDB');

    const services = await Service.find({}, 'title category price').limit(10);
    console.log('Services found:', services.length);
    services.forEach(service => {
      console.log('Service:', {
        id: service._id,
        title: service.title,
        category: service.category,
        price: service.price
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkServices();
