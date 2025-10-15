const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Review = require('../models/Review');
const Service = require('../models/Service');
const User = require('../models/User');

const seedData = async () => {
    try {
        // Clear existing data
        await Payment.deleteMany({});
        await Refund.deleteMany({});
        await Review.deleteMany({});
        await Service.deleteMany({});
        await User.deleteMany({});

        // Seed Users
        const users = await User.insertMany([
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'user1', password: 'user123', role: 'user' },
            { username: 'user2', password: 'user123', role: 'user' },
        ]);

        // Seed Services
        const services = await Service.insertMany([
            { name: 'Service 1', description: 'Description for Service 1', price: 100 },
            { name: 'Service 2', description: 'Description for Service 2', price: 200 },
        ]);

        // Seed Payments
        const payments = await Payment.insertMany([
            { userId: users[0]._id, serviceId: services[0]._id, amount: 100, status: 'completed' },
            { userId: users[1]._id, serviceId: services[1]._id, amount: 200, status: 'pending' },
        ]);

        // Seed Refunds
        const refunds = await Refund.insertMany([
            { paymentId: payments[1]._id, amount: 200, status: 'requested' },
        ]);

        // Seed Reviews
        const reviews = await Review.insertMany([
            { userId: users[0]._id, serviceId: services[0]._id, rating: 5, comment: 'Excellent service!' },
            { userId: users[1]._id, serviceId: services[1]._id, rating: 4, comment: 'Very good!' },
        ]);

        console.log('Data seeded successfully!');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedData();