// This file contains a script to fix MongoDB indexes.

const mongoose = require('mongoose');
const { Payment, Refund, Review, Service, User } = require('../models');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Fix indexes for the Payment model
const fixPaymentIndexes = async () => {
    const paymentIndexes = await Payment.collection.indexes();
    console.log('Current Payment Indexes:', paymentIndexes);
    // Add or modify indexes as needed
};

// Fix indexes for the Refund model
const fixRefundIndexes = async () => {
    const refundIndexes = await Refund.collection.indexes();
    console.log('Current Refund Indexes:', refundIndexes);
    // Add or modify indexes as needed
};

// Fix indexes for the Review model
const fixReviewIndexes = async () => {
    const reviewIndexes = await Review.collection.indexes();
    console.log('Current Review Indexes:', reviewIndexes);
    // Add or modify indexes as needed
};

// Fix indexes for the Service model
const fixServiceIndexes = async () => {
    const serviceIndexes = await Service.collection.indexes();
    console.log('Current Service Indexes:', serviceIndexes);
    // Add or modify indexes as needed
};

// Fix indexes for the User model
const fixUserIndexes = async () => {
    const userIndexes = await User.collection.indexes();
    console.log('Current User Indexes:', userIndexes);
    // Add or modify indexes as needed
};

// Main function to run the script
const main = async () => {
    await connectDB();
    await fixPaymentIndexes();
    await fixRefundIndexes();
    await fixReviewIndexes();
    await fixServiceIndexes();
    await fixUserIndexes();
    mongoose.connection.close();
};

main().catch((error) => {
    console.error('Error in fix-mongodb-index script:', error);
    process.exit(1);
});