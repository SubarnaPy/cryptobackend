const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const makeAdmin = async (userId) => {
    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found');
            return;
        }

        // Promote the user to admin
        user.role = 'admin';
        await user.save();

        console.log(`User with ID ${userId} has been promoted to admin.`);
        console.log(`User details:`, { email: user.email, username: user.username, role: user.role });
    } catch (error) {
        console.error('Error making admin:', error);
    }
};

// Example usage: makeAdmin('userIdHere');
// Replace 'userIdHere' with the actual user ID you want to promote to admin.

if (require.main === module) {
    const userId = process.argv[2];
    if (!userId) {
        console.error('Please provide a user ID as an argument.');
        process.exit(1);
    }
    makeAdmin(userId);
}