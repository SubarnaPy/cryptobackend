const Payment = require('../models/Payment');

async function fixPaymentStatus() {
    try {
        const payments = await Payment.find({ status: { $ne: 'completed' } });

        for (const payment of payments) {
            // Logic to determine the correct status
            if (payment.amount > 0 && !payment.isRefunded) {
                payment.status = 'pending';
            } else if (payment.isRefunded) {
                payment.status = 'refunded';
            } else {
                payment.status = 'failed';
            }

            await payment.save();
            console.log(`Updated payment ID ${payment._id} to status ${payment.status}`);
        }

        console.log('Payment statuses fixed successfully.');
    } catch (error) {
        console.error('Error fixing payment statuses:', error);
    }
}

fixPaymentStatus();