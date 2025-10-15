/**
 * Quick verification script to check payment status
 * Run with: node verify-payment.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');

const CHECKOUT_SESSION_ID = 'cs_test_b1hJAXmSLatOpjtodzWLgUFW92BUFR79tks1QFN5LAHheGOHhm8Qkl8oJ5';

async function verifyPayment() {
  try {
    console.log('🔍 Verifying payment status...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const payment = await Payment.findOne({ 
      stripeCheckoutSessionId: CHECKOUT_SESSION_ID 
    });

    if (!payment) {
      console.error('❌ Payment not found!');
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════');
    console.log('           PAYMENT VERIFICATION            ');
    console.log('═══════════════════════════════════════════');
    console.log(`Payment ID:         ${payment._id}`);
    console.log(`Status:             ${payment.status === 'succeeded' ? '✅ SUCCEEDED' : '❌ ' + payment.status.toUpperCase()}`);
    console.log(`Amount:             $${(payment.amount / 100).toFixed(2)}`);
    console.log(`Currency:           ${payment.currency.toUpperCase()}`);
    console.log(`Customer:           ${payment.customerName}`);
    console.log(`Email:              ${payment.customerEmail}`);
    console.log(`Service:            ${payment.serviceDetails?.title || 'N/A'}`);
    console.log(`Payment Method:     ${payment.paymentMethod}`);
    console.log(`Checkout Session:   ${payment.stripeCheckoutSessionId}`);
    console.log(`Payment Intent:     ${payment.stripePaymentIntentId || 'Not set'}`);
    console.log(`Created:            ${payment.createdAt.toISOString()}`);
    console.log(`Updated:            ${payment.updatedAt.toISOString()}`);
    console.log('═══════════════════════════════════════════\n');

    if (payment.status === 'succeeded') {
      console.log('✅ Payment is successfully processed!');
      console.log('🎉 Everything is working correctly!\n');
    } else {
      console.log(`⚠️  Warning: Payment status is "${payment.status}"`);
      console.log('💡 Run fix-payment-status.js to update it.\n');
    }

    // Check if there are any pending payments for the same user
    const pendingPayments = await Payment.find({
      userId: payment.userId,
      status: 'pending'
    });

    if (pendingPayments.length > 0) {
      console.log(`⚠️  Found ${pendingPayments.length} other pending payment(s) for this user:`);
      pendingPayments.forEach((p, i) => {
        console.log(`   ${i + 1}. Payment ${p._id} - $${(p.amount / 100).toFixed(2)} - ${p.createdAt.toISOString()}`);
      });
      console.log('   💡 You may want to check these as well.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

verifyPayment();
