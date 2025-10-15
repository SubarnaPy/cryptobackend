const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdminData = async () => {
    try {
        // Clear existing users
        await User.deleteMany({});

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: 'securepassword', // Ensure to hash this in production
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user seeded successfully');
    } catch (error) {
        console.error('Error seeding admin data:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Connect to the database and seed data
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        seedAdminData();
    })
    .catch(error => {
        console.error('MongoDB connection error:', error);
    });