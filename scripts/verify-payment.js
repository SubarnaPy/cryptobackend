// This file contains a script to verify payment transactions.

const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const stripeService = require('../services/stripeService');

async function verifyPayment(paymentId) {
    try {
        // Fetch the payment details from the database
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        // Verify the payment with Stripe
        const stripePayment = await stripeService.retrievePayment(payment.stripePaymentId);
        if (stripePayment.status === 'succeeded') {
            payment.status = 'verified';
            await payment.save();
            console.log(`Payment ${paymentId} verified successfully.`);
        } else {
            throw new Error('Payment verification failed');
        }
    } catch (error) {
        console.error(`Error verifying payment: ${error.message}`);
    }
}

module.exports = verifyPayment;