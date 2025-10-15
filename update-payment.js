const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('./models/Payment');

async function updatePayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the payment with the checkout session ID from PaymentSuccess.tsx log
    const payment = await Payment.findOne({
      stripeCheckoutSessionId: 'cs_test_b1XE7sIis8UDeq6of8cpPP9rOknQl1juhVobB5MAU4xjgVbtRvFCmRy45E'
    });

    if (!payment) {
      console.log('Payment not found with session ID: cs_test_b1XE7sIis8UDeq6of8cpPP9rOknQl1juhVobB5MAU4xjgVbtRvFCmRy45E');
      return;
    }

    console.log('Found payment:', {
      _id: payment._id,
      status: payment.status,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId
    });

    // Update status to succeeded since the payment was successful on frontend
    payment.status = 'succeeded';
    payment.stripeMetadata = {
      ...payment.stripeMetadata,
      manually_updated: true,
      update_reason: 'Payment was successful but status not updated due to webhook bug'
    };

    await payment.save();
    console.log('Payment status updated to succeeded');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePayment();
