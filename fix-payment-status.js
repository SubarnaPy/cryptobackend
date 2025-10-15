/**
 * Script to manually fix payment status for stuck payments
 * Run this with: node fix-payment-status.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');

// Update this to match your checkout session ID
const CHECKOUT_SESSION_ID = process.argv[2] || 'cs_test_b19bPcS0Dyet6Q6Pq2qPMgqgOo0VGZcLWZ1JNbEdQ0bHu1NqJwB3WU2RhO';

async function fixPaymentStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log(`\nSearching for payment with checkout session ID: ${CHECKOUT_SESSION_ID}`);
    
    const payment = await Payment.findOne({ 
      stripeCheckoutSessionId: CHECKOUT_SESSION_ID 
    });

    if (!payment) {
      console.error('❌ Payment not found!');
      process.exit(1);
    }

    console.log('\n📄 Current Payment Details:');
    console.log('  ID:', payment._id);
    console.log('  User ID:', payment.userId);
    console.log('  Service ID:', payment.serviceId);
    console.log('  Amount:', payment.amount);
    console.log('  Currency:', payment.currency);
    console.log('  Status:', payment.status);
    console.log('  Checkout Session ID:', payment.stripeCheckoutSessionId);
    console.log('  Payment Intent ID:', payment.stripePaymentIntentId);
    console.log('  Customer Email:', payment.customerEmail);
    console.log('  Created At:', payment.createdAt);

    if (payment.status === 'succeeded') {
      console.log('\n✅ Payment is already marked as succeeded!');
      process.exit(0);
    }

    console.log('\n🔄 Updating payment status to "succeeded"...');
    
    payment.status = 'succeeded';
    payment.stripeMetadata = {
      ...payment.stripeMetadata,
      manually_fixed: true,
      fixed_at: new Date().toISOString(),
      fixed_reason: 'Payment completed but webhook did not update status',
    };

    await payment.save();

    console.log('✅ Payment status updated successfully!');
    console.log('\n📄 Updated Payment Details:');
    console.log('  Status:', payment.status);
    console.log('  Updated At:', payment.updatedAt);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixPaymentStatus();
