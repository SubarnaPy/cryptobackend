const mongoose = require('mongoose');
const User = require('../models/User');

async function listUsers() {
    try {
        const users = await User.find({});
        console.log('List of Users:');
        users.forEach(user => {
            console.log(`- ${user.username} (ID: ${user._id})`);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        mongoose.connection.close();
    }
}

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        listUsers();
    })
    .catch(error => {
        console.error('MongoDB connection error:', error);
    });