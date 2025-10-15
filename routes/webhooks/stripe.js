const express = require('express');
const router = express.Router();
const Payment = require('../../models/Payment');
const Refund = require('../../models/Refund');
const { validateWebhook } = require('../../services/stripeService');

// Stripe webhook endpoint - raw body parsing is handled globally in your server.js
router.post('/', async (req, res) => {
  let event;

  console.log('\n🔔 ========== STRIPE WEBHOOK RECEIVED ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request headers:', {
    'stripe-signature': req.get('stripe-signature') ? 'Present' : 'Missing',
    'content-type': req.get('content-type'),
  });

  try {
    // This function correctly parses the raw body into a usable event object
    event = validateWebhook(req);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ CORRECTION: Use the parsed 'event' object from now on.
  const dataObject = event.data.object; // The actual data payload
  const eventType = event.type;         // The event type string (e.g., 'payment_intent.succeeded')

  console.log(`📨 Event Type: ${eventType}`);
  console.log(`Event ID: ${event.id || 'N/A'}`);
  console.log(`Event Object ID: ${dataObject?.id || 'N/A'}`);

  try {
    // Pass the correctly parsed 'dataObject' to your handlers
    switch (eventType) {
      case 'payment_intent.succeeded':
        console.log('→ Handling payment_intent.succeeded');
        await handlePaymentIntentSucceeded(dataObject);
        break;

      case 'payment_intent.payment_failed':
        console.log('→ Handling payment_intent.payment_failed');
        await handlePaymentIntentFailed(dataObject);
        break;

      case 'charge.dispute.created':
        console.log('→ Handling charge.dispute.created');
        await handleChargeDisputeCreated(dataObject);
        break;

      case 'charge.refunded':
        console.log('→ Handling charge.refunded');
        await handleChargeRefunded(dataObject);
        break;

      case 'checkout.session.completed':
        console.log('→ Handling checkout.session.completed');
        await handleCheckoutSessionCompleted(dataObject);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`);
    }

    console.log('✅ Webhook processed successfully');
    console.log('===============================================\n');
    res.json({ received: true });
  } catch (error) {
    console.error(`❌ Error processing webhook for event type ${eventType}:`, error);
    console.error('Error stack:', error.stack);
    console.log('===============================================\n');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});


// --- Handler Functions ---


async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('=== PAYMENT INTENT SUCCEEDED WEBHOOK ===');
    console.log(`Payment Intent ID: ${paymentIntent.id}`);
    
    let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

    if (!payment && paymentIntent.metadata?.userId && paymentIntent.metadata?.serviceId) {
      console.log('Payment not found by intent ID, searching by metadata...');
      payment = await Payment.findOne({
        userId: paymentIntent.metadata.userId,
        serviceId: parseInt(paymentIntent.metadata.serviceId),
        status: { $in: ['pending', 'processing'] }
      }).sort({ createdAt: -1 });
      
      if (payment) {
        console.log(`✅ Found payment by metadata: ${payment._id}`);
        payment.stripePaymentIntentId = paymentIntent.id;
      }
    }

    if (!payment) {
      console.error(`❌ No payment found for payment intent: ${paymentIntent.id}`);
      return;
    }

    console.log(`✅ Found payment in database: ${payment._id}`);
    
    payment.status = 'succeeded';
    payment.paymentMethod = paymentIntent.payment_method_types?.[0] || 'card';
    payment.stripeMetadata = {
      ...payment.stripeMetadata,
      ...paymentIntent.metadata,
      payment_intent_succeeded_at: new Date().toISOString(),
    };

    await payment.save();
    console.log(`✅ Successfully updated payment ${payment._id} to SUCCEEDED status`);
  } catch (error) {
    console.error('❌ Error in handlePaymentIntentSucceeded:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log(`Processing payment_intent.payment_failed: ${paymentIntent.id}`);
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

    if (!payment) {
      console.warn(`No payment found for failed payment intent: ${paymentIntent.id}`);
      return;
    }
    
    payment.status = 'failed';
    payment.stripeMetadata = {
      ...payment.stripeMetadata,
      failure_code: paymentIntent.last_payment_error?.code,
      failure_message: paymentIntent.last_payment_error?.message,
    };

    await payment.save();
    console.log(`Updated payment ${payment._id} to FAILED status`);
  } catch (error) {
    console.error('❌ Error in handlePaymentIntentFailed:', error);
    throw error;
  }
}

async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('=== CHECKOUT SESSION COMPLETED WEBHOOK ===');
    console.log(`Session ID: ${session.id}`);
    
    const payment = await Payment.findOne({ stripeCheckoutSessionId: session.id });

    if (!payment) {
      console.error(`❌ No payment found for checkout session: ${session.id}`);
      return;
    }

    console.log(`✅ Found payment in database: ${payment._id}`);
    
    if (session.payment_intent && !payment.stripePaymentIntentId) {
      console.log(`Updating stripePaymentIntentId to ${session.payment_intent}`);
      payment.stripePaymentIntentId = session.payment_intent;
    }

    if (session.payment_status === 'paid' && payment.status !== 'succeeded') {
      payment.status = 'succeeded';
      console.log(`✅ Payment ${payment._id} status set to SUCCEEDED`);
    } else if (session.payment_status === 'unpaid' && payment.status !== 'failed') {
      payment.status = 'failed';
      console.log(`❌ Payment ${payment._id} status set to FAILED`);
    }

    payment.stripeMetadata = {
      ...payment.stripeMetadata,
      customer_email: session.customer_details?.email,
      payment_status: session.payment_status,
      webhook_received_at: new Date().toISOString(),
    };

    await payment.save();
    console.log(`✅ Successfully updated payment ${payment._id}`);
  } catch (error) {
    console.error('❌ Error in handleCheckoutSessionCompleted:', error);
    throw error;
  }
}

async function handleChargeRefunded(charge) {
  try {
    console.log(`Processing charge.refunded: ${charge.id}`);
    const refund = await Refund.findOne({
      stripeRefundId: { $exists: true },
      status: 'processing'
    }).sort({ createdAt: -1 });

    if (!refund) {
      console.warn(`No processing refund found for charge refund: ${charge.id}`);
      return;
    }
    refund.status = 'succeeded';
    await refund.save();
    const payment = await Payment.findById(refund.paymentId);
    if (payment && payment.status !== 'refunded') {
      payment.status = 'refunded';
      await payment.save();
    }
    console.log(`Updated refund ${refund._id} to succeeded status`);
  } catch (error) {
    console.error('Error handling charge.refunded:', error);
    throw error;
  }
}

async function handleChargeDisputeCreated(dispute) {
  try {
    console.log(`Processing charge.dispute.created: ${dispute.id}`);
    const payment = await Payment.findOne({ stripePaymentIntentId: dispute.payment_intent });
    if (!payment) {
      console.warn(`No payment found for dispute: ${dispute.id}`);
      return;
    }
    console.log(`Dispute created for payment ${payment._id}: ${dispute.reason}`);
  } catch (error) {
    console.error('Error handling charge.dispute.created:', error);
    throw error;
  }
}

module.exports = router;