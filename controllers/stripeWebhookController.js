const { validateWebhook } = require('../services/stripeService');
const Payment = require('../models/Payment');
const Purchase = require('../models/Purchase');
const Refund = require('../models/Refund');

exports.handleStripeWebhook = async (req, res) => {
  let event;

  try {
    // Validate and construct the event using Stripe's webhook validation
    event = validateWebhook(req);

    if (event === true) {
      // Development mode (no endpoint secret)
      event = req.body;
    }

  } catch (err) {
    console.error('❌ Webhook validation failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventType = event.type;
  const data = event.data.object;

  console.log(`⚡ Stripe Webhook Event Received: ${eventType}`);
  console.log(`📋 Event ID: ${event.id || 'N/A'}`);
  console.log(`🎯 Data Object ID: ${data?.id || 'N/A'}`);

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        const sessionId = data.id;
        const paymentIntentId = data.payment_intent;

        console.log('✅ Checkout session completed:', sessionId);

        const payment = await Payment.findOne({ stripeCheckoutSessionId: sessionId });
        if (!payment) {
          console.warn(`⚠️ No payment found for checkout session: ${sessionId}`);
          return res.status(200).json({ received: true });
        }

        // Update payment with payment intent ID and mark as succeeded
        payment.stripePaymentIntentId = paymentIntentId;
        payment.status = 'succeeded'; // Consistent with other parts of the codebase
        payment.updatedAt = new Date();
        await payment.save();
        console.log(`💰 Updated payment ${payment._id} to succeeded status`);

        // Create Purchase records for cart items
        if (payment.serviceDetails?.items) {
          for (const item of payment.serviceDetails.items) {
            try {
              const purchase = new Purchase({
                userId: payment.userId,
                itemType: item.itemType,
                itemId: item.itemId,
                paymentId: payment._id,
                price: item.price || 0,
                quantity: item.quantity || 1
              });
              await purchase.save();
              console.log(`🛒 Created purchase record for ${item.itemType} ${item.itemId}`);
            } catch (purchaseError) {
              console.error(`❌ Error creating purchase record:`, purchaseError);
              // Continue processing other items even if one fails
            }
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntentId = data.id;

        console.log('✅ Payment intent succeeded:', paymentIntentId);

        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
        if (!payment) {
          console.warn(`⚠️ No payment found for payment intent: ${paymentIntentId}`);
          return res.status(200).json({ received: true });
        }

        // Update payment status and amount received
        payment.status = 'succeeded'; // Consistent status
        payment.amountReceived = data.amount_received;
        payment.updatedAt = new Date();

        await payment.save();
        console.log(`💰 Updated payment ${payment._id} to succeeded status`);
        break;
      }

      case 'charge.refunded': {
        const chargeId = data.id;
        const paymentIntentId = data.payment_intent;

        console.log('💸 Charge refunded:', chargeId);

        // Find and update payment status
        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
        if (payment) {
          payment.status = 'refunded';
          payment.updatedAt = new Date();
          await payment.save();
          console.log(`💰 Updated payment ${payment._id} to refunded status`);
        } else {
          console.warn(`⚠️ No payment found for payment intent: ${paymentIntentId}`);
        }

        // Find and update refund status - use payment relationship for reliable matching
        if (payment) {
          const refund = await Refund.findOne({
            paymentId: payment._id,
            status: 'processing',
            stripeRefundId: { $exists: true, $ne: null }
          });

          if (refund) {
            refund.status = 'succeeded';
            refund.refundProcessedAt = new Date();
            await refund.save();
            console.log(`🔄 Updated refund ${refund._id} to succeeded status`);
          } else {
            console.log(`ℹ️ No processing refund found for payment ${payment._id}`);
          }
        }
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`);
    }

    // Respond to Stripe to confirm receipt
    res.json({ received: true });
  } catch (err) {
    console.error('❌ Error processing webhook event:', err.message);
    console.error('📋 Event type:', eventType);
    console.error('📋 Error stack:', err.stack);
    res.status(500).json({ error: 'Internal server error processing webhook' });
  }
};