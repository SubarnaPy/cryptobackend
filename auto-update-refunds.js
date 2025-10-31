const mongoose = require('mongoose');
const Refund = require('./models/Refund');
const Payment = require('./models/Payment');
const { getRefundDetails } = require('./services/stripeService');

// Load environment variables
require('dotenv').config();

async function autoUpdateProcessingRefunds() {
  try {
    await mongoose.connect('mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/canada_admin');

    console.log('🔄 Checking for processing refunds to update...');

    // Find all refunds in processing status with stripeRefundId
    const processingRefunds = await Refund.find({
      status: 'processing',
      stripeRefundId: { $exists: true, $ne: null }
    });

    console.log(`Found ${processingRefunds.length} processing refunds`);

    let updated = 0;

    for (const refund of processingRefunds) {
      try {
        console.log(`Checking refund ${refund._id}...`);

        // Get refund status from Stripe
        const stripeRefund = await getRefundDetails(refund.stripeRefundId);

        if (stripeRefund.status === 'succeeded') {
          // Update refund status
          refund.status = 'succeeded';
          refund.refundProcessedAt = new Date();
          await refund.save();

          // Update payment status
          const payment = await Payment.findById(refund.paymentId);
          if (payment && payment.status !== 'refunded') {
            payment.status = 'refunded';
            payment.updatedAt = new Date();
            await payment.save();
          }

          console.log(`✅ Updated refund ${refund._id} to succeeded`);
          updated++;
        } else if (stripeRefund.status === 'failed') {
          refund.status = 'failed';
          await refund.save();
          console.log(`❌ Updated refund ${refund._id} to failed`);
          updated++;
        } else {
          console.log(`⏳ Refund ${refund._id} still ${stripeRefund.status} on Stripe`);
        }
      } catch (error) {
        console.error(`Error checking refund ${refund._id}:`, error.message);
      }
    }

    console.log(`\n📊 Summary: Updated ${updated} out of ${processingRefunds.length} refunds`);

    if (processingRefunds.length > 0 && updated === 0) {
      console.log('\n💡 Tip: Make sure your Stripe webhooks are configured properly:');
      console.log('   1. Install Stripe CLI: https://stripe.com/docs/stripe-cli');
      console.log('   2. Run: stripe listen --forward-to localhost:5000/api/webhooks/stripe');
      console.log('   3. Configure webhook events in Stripe dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  autoUpdateProcessingRefunds();
}

module.exports = { autoUpdateProcessingRefunds };