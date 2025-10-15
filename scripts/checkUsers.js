const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const checkUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/canada_admin', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        // Find all users
        const users = await User.find({});
        
        console.log('\n📊 Total users:', users.length);
        console.log('\n=== USER LIST ===');
        
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. User:`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Created: ${user.createdAt}`);
        });

        // Count admin users
        const adminCount = await User.countDocuments({ role: 'admin' });
        console.log('\n👑 Admin users:', adminCount);

        // List admin users
        const admins = await User.find({ role: 'admin' });
        if (admins.length > 0) {
            console.log('\n=== ADMIN USERS ===');
            admins.forEach((admin, index) => {
                console.log(`${index + 1}. ${admin.email} (${admin.username})`);
            });
        } else {
            console.log('\n⚠️  NO ADMIN USERS FOUND!');
            console.log('   Run "node scripts/createAdmin.js" to create an admin user.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    }
};

checkUsers();
