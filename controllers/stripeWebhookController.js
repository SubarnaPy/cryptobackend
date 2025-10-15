class StripeWebhookController {
    constructor() {
        // Initialize any necessary properties or dependencies
    }

    handleWebhook(req, res) {
        const event = req.body;

        // Handle the event based on its type
        switch (event.type) {
            case 'payment_intent.succeeded':
                this.handlePaymentIntentSucceeded(event);
                break;
            case 'payment_intent.payment_failed':
                this.handlePaymentIntentFailed(event);
                break;
            // Add more cases as needed for other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Respond with a 200 status to acknowledge receipt of the event
        res.status(200).send('Webhook received');
    }

    handlePaymentIntentSucceeded(event) {
        const paymentIntent = event.data.object;
        // Handle successful payment intent (e.g., update database, send confirmation)
        console.log(`PaymentIntent was successful! ID: ${paymentIntent.id}`);
    }

    handlePaymentIntentFailed(event) {
        const paymentIntent = event.data.object;
        // Handle failed payment intent (e.g., notify user, log error)
        console.log(`PaymentIntent failed! ID: ${paymentIntent.id}`);
    }
}


exports.handleStripeWebhook = async (req, res) => {
  let event;

  try {
    // 1️⃣ Validate and construct the event using your helper
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

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        const sessionId = data.id;
        const paymentIntentId = data.payment_intent;

        console.log('✅ Checkout session completed:', sessionId);

        const payment = await Payment.findOne({ stripeCheckoutSessionId: sessionId });
        if (!payment) {
          console.warn(`No payment found for checkout session: ${sessionId}`);
          return res.status(200).json({ received: true });
        }

        payment.stripePaymentIntentId = paymentIntentId;
        payment.status = 'completed';
        payment.updatedAt = new Date();

        await payment.save();
        console.log(`Updated payment ${payment._id} to completed status`);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntentId = data.id;

        console.log('✅ Payment intent succeeded:', paymentIntentId);

        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
        if (!payment) {
          console.warn(`No payment found for payment intent: ${paymentIntentId}`);
          return res.status(200).json({ received: true });
        }

        payment.status = 'paid';
        payment.amountReceived = data.amount_received;
        payment.updatedAt = new Date();

        await payment.save();
        console.log(`Updated payment ${payment._id} to paid status`);
        break;
      }

      case 'charge.refunded': {
        const paymentIntentId = data.payment_intent;

        console.log('💸 Charge refunded:', paymentIntentId);

        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
        if (!payment) {
          console.warn(`No payment found for payment intent: ${paymentIntentId}`);
          return res.status(200).json({ received: true });
        }

        payment.status = 'refunded';
        payment.updatedAt = new Date();

        await payment.save();
        console.log(`Updated payment ${payment._id} to refunded status`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Respond to Stripe to confirm receipt
    res.json({ received: true });
  } catch (err) {
    console.error('❌ Error processing webhook event:', err.message);
    res.status(500).json({ error: err.message });
  }
};


module.exports = StripeWebhookController;