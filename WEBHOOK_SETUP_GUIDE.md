# WEBHOOK SETUP GUIDE

## Overview
This guide provides instructions for setting up webhooks in your application to handle events from Stripe. Webhooks allow your application to receive real-time notifications about events that occur in your Stripe account.

## Prerequisites
- A Stripe account
- Access to your backend server
- Basic understanding of Node.js and Express

## Step 1: Configure Your Stripe Account
1. Log in to your Stripe account.
2. Navigate to the "Developers" section in the dashboard.
3. Click on "Webhooks" in the left sidebar.
4. Click on the "Add endpoint" button.
5. Enter your webhook URL (e.g., `https://yourdomain.com/api/webhooks/stripe`).
6. Select the events you want to listen to (e.g., `payment_intent.succeeded`, `payment_intent.payment_failed`, etc.).
7. Click "Add endpoint" to save your settings.

## Step 2: Implement Webhook Handling in Your Application
1. In your backend, locate the `routes/webhooks/stripe.js` file.
2. Ensure that the file exports a route to handle incoming webhook events. Here’s an example:

```javascript
const express = require('express');
const router = express.Router();
const StripeWebhookController = require('../../controllers/stripeWebhookController');

router.post('/', StripeWebhookController.handleWebhook);

module.exports = router;
```

3. In the `controllers/stripeWebhookController.js` file, implement the `handleWebhook` method to process the incoming events:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeWebhookController {
    static async handleWebhook(req, res) {
        const event = req.body;

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                // Handle successful payment
                break;
            case 'payment_intent.payment_failed':
                // Handle failed payment
                break;
            // Add more cases as needed
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Respond with 200 status to acknowledge receipt of the event
        res.status(200).send('Received');
    }
}

module.exports = StripeWebhookController;
```

## Step 3: Test Your Webhook
1. Use the Stripe CLI or Postman to send test webhook events to your endpoint.
2. Verify that your application correctly processes the events and responds appropriately.

## Conclusion
You have successfully set up webhooks for your application. Make sure to monitor the logs for any errors and adjust your handling logic as necessary.