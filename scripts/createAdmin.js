const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/canada_admin', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@canadiannexus.com' });
        
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('   Email:', existingAdmin.email);
            console.log('   Role:', existingAdmin.role);
            
            if (existingAdmin.role !== 'admin') {
                console.log('\n🔧 Updating role to admin...');
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ User role updated to admin!');
            }
        } else {
            // Create new admin user
            const adminUser = new User({
                username: 'admin',
                email: 'admin@canadiannexus.com',
                password: 'Admin@123', // This will be hashed by the pre-save hook
                role: 'admin'
            });

            await adminUser.save();
            console.log('\n✅ Admin user created successfully!');
            console.log('   Email: admin@canadiannexus.com');
            console.log('   Password: Admin@123');
            console.log('   Role:', adminUser.role);
            console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    }
};

createAdmin();
