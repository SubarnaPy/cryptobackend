const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

// ✅ CORRECTED Webhook Validation
const validateWebhook = (req) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;

  // If no endpoint secret configured, skip validation for development
  if (!endpointSecret) {
    console.warn('STRIPE_WEBHOOK_ENDPOINT_SECRET not configured. Skipping signature validation for development.');
    try {
      // For development, parse the raw body buffer as a JSON string
      return JSON.parse(req.body.toString('utf8'));
    } catch (e) {
      console.error('Failed to parse webhook body in dev mode:', e);
      throw new Error('Invalid JSON in webhook body');
    }
  }

  // In production, verify the signature
  try {
    const sig = req.get('stripe-signature');
    if (!sig) {
      throw new Error('No stripe-signature header found');
    }
    // The constructEvent method expects the raw request body (Buffer)
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    return event;
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
};


// --- Your other functions remain the same ---


const createCheckoutSession = async (sessionData) => {
  try {
    const {
      amount,
      currency,
      serviceDetails,
      customerEmail,
      successUrl,
      cancelUrl,
      metadata,
    } = sessionData;

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: serviceDetails.title,
              description: `Category: ${serviceDetails.category} | Consultant: ${serviceDetails.consultant} | Duration: ${serviceDetails.duration}`,
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: metadata,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('Stripe Session Created Successfully. Session ID:', session.id);
    return session;
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error.message);
    throw new Error(`Stripe checkout session creation failed: ${error.message}`);
  }
};

const confirmPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed',
      paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
      amountReceived: paymentIntent.amount_received,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw new Error(`Payment intent confirmation failed: ${error.message}`);
  }
};

const createRefund = async (refund, paymentIntentId) => {
  try {
    const stripeRefund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refund.refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        userId: refund.userId.toString(),
        serviceId: refund.serviceId.toString(),
        refundReason: refund.refundReason,
      },
    });

    return stripeRefund;
  } catch (error) {
    console.error('Error creating Stripe refund:', error);
    throw new Error(`Stripe refund creation failed: ${error.message}`);
  }
};

const getPaymentDetails = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error getting payment details:', error);
    throw new Error(`Failed to retrieve payment details: ${error.message}`);
  }
};

const getRefundDetails = async (refundId) => {
  try {
    const refund = await stripe.refunds.retrieve(refundId);
    return refund;
  } catch (error) {
    console.error('Error getting refund details:', error);
    throw new Error(`Failed to retrieve refund details: ${error.message}`);
  }
};

module.exports = {
  validateWebhook,
  createCheckoutSession,
  confirmPaymentIntent,
  createRefund,
  getPaymentDetails,
  getRefundDetails,
};