const Payment = require('../models/Payment');

async function updatePayment(paymentId, updateData) {
    try {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        Object.assign(payment, updateData);
        await payment.save();
        return payment;
    } catch (error) {
        throw new Error(`Error updating payment: ${error.message}`);
    }
}

module.exports = updatePayment;