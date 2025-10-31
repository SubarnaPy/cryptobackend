const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import models
const Consultation = require('./models/Consultation');
const Purchase = require('./models/Purchase');
const Payment = require('./models/Payment');
const Product = require('./models/Product');
const Service = require('./models/Service');

dotenv.config();

async function debugDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB for debugging...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus');

    console.log('📊 Checking database collections...\n');

    // Check all collections
    const collections = [
      { name: 'Consultations', model: Consultation },
      { name: 'Purchases', model: Purchase },
      { name: 'Payments', model: Payment },
      { name: 'Products', model: Product },
      { name: 'Services', model: Service }
    ];

    for (const { name, model } of collections) {
      const count = await model.countDocuments();
      console.log(`📋 ${name}: ${count} documents`);

      if (count > 0) {
        const sample = await model.findOne().limit(1);
        console.log(`   Sample ${name.toLowerCase()}:`, JSON.stringify(sample, null, 2));
      }
      console.log('');
    }

    // Check specific analytics queries
    console.log('🔍 Testing analytics queries...\n');

    // Check consultations with payments (updated to use succeeded status)
    console.log('1️⃣ Consultations with succeeded payments:');
    const consultationsWithPayments = await Consultation.aggregate([
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'consultationId',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] },
          'payment.status': 'succeeded'
        }
      }
    ]);
    console.log(`   Found: ${consultationsWithPayments.length} consultations`);
    if (consultationsWithPayments.length > 0) {
      console.log('   Sample:', consultationsWithPayments[0]);
    }
    console.log('');

    // Check purchases with payments (updated to use succeeded status)
    console.log('2️⃣ Product purchases with succeeded payments:');
    const purchasesWithPayments = await Purchase.aggregate([
      {
        $match: { itemType: 'product' }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentId',
          foreignField: '_id',
          as: 'payment'
        }
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payment.status': 'succeeded'
        }
      }
    ]);
    console.log(`   Found: ${purchasesWithPayments.length} purchases`);
    if (purchasesWithPayments.length > 0) {
      console.log('   Sample:', purchasesWithPayments[0]);
    }
    console.log('');

    // Check payments by status
    console.log('3️⃣ Payment status breakdown:');
    const paymentStatuses = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('   Payment statuses:', paymentStatuses);
    console.log('');

    console.log('✅ Database debugging complete!');

  } catch (error) {
    console.error('❌ Error debugging database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

debugDatabase();