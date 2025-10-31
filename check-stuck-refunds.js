const mongoose = require('mongoose');
const Refund = require('./models/Refund');
const Payment = require('./models/Payment');
const { getRefundDetails } = require('./services/stripeService');
require('dotenv').config();

async function checkStuckRefunds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus');

    console.log('Checking for stuck refunds...');

    // Find refunds that are processing but have stripeRefundId
    const stuckRefunds = await Refund.find({
      status: 'processing',
      stripeRefundId: { $exists: true, $ne: null }
    });

    console.log(`Found ${stuckRefunds.length} stuck refunds`);

    for (const refund of stuckRefunds) {
      try {
        console.log(`Checking refund ${refund._id} with Stripe ID ${refund.stripeRefundId}`);

        const stripeRefund = await getRefundDetails(refund.stripeRefundId);

        if (stripeRefund.status === 'succeeded') {
          refund.status = 'succeeded';
          refund.refundProcessedAt = new Date();
          await refund.save();

          // Update payment status
          if (refund.paymentId) {
            const payment = await Payment.findById(refund.paymentId);
            if (payment) {
              payment.status = 'refunded';
              await payment.save();
              console.log(`Updated payment ${payment._id} to refunded`);
            }
          }

          console.log(`✅ Updated refund ${refund._id} to succeeded`);
        } else if (stripeRefund.status === 'failed') {
          refund.status = 'failed';
          await refund.save();
          console.log(`❌ Updated refund ${refund._id} to failed`);
        } else {
          console.log(`⏳ Refund ${refund._id} still ${stripeRefund.status} on Stripe`);
        }
      } catch (error) {
        console.error(`Error checking refund ${refund._id}:`, error.message);
      }
    }

    console.log('Finished checking stuck refunds');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkStuckRefunds();