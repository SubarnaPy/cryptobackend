const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Webinar = require('../models/Webinar');
const Purchase = require('../models/Purchase');

const deleteAllPurchases = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/canada_admin');
    
    console.log('Connected to MongoDB');
    
    // Delete all payments
    const paymentsResult = await Payment.deleteMany({});
    console.log(`Deleted ${paymentsResult.deletedCount} payments`);
    
    // Delete all refunds
    const refundsResult = await Refund.deleteMany({});
    console.log(`Deleted ${refundsResult.deletedCount} refunds`);
    
    // Delete all product purchases
    const purchasesResult = await Purchase.deleteMany({});
    console.log(`Deleted ${purchasesResult.deletedCount} product purchases`);
    
    // Clear all webinar registrations
    const webinars = await Webinar.find({});
    let totalCleared = 0;
    for (const webinar of webinars) {
      totalCleared += webinar.registrations.length;
      webinar.registrations = [];
      await webinar.save();
    }
    console.log(`Cleared ${totalCleared} webinar registrations`);
    
    console.log('All purchases and registrations deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting purchases:', error);
    process.exit(1);
  }
};

deleteAllPurchases();
