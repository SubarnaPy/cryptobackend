const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Webinar = require('../models/Webinar');

const clearRegistrations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/canada_admin');
    
    console.log('Connected to MongoDB');
    
    // Get all webinars
    const webinars = await Webinar.find({});
    console.log(`Found ${webinars.length} webinars`);
    
    // Clear registrations from all webinars
    for (const webinar of webinars) {
      const regCount = webinar.registrations.length;
      webinar.registrations = [];
      await webinar.save();
      console.log(`Cleared ${regCount} registrations from: ${webinar.title}`);
    }
    
    console.log('All webinar registrations cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing registrations:', error);
    process.exit(1);
  }
};

clearRegistrations();
