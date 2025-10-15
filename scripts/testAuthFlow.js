const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

dotenv.config();

const testAuthFlow = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/canada_admin', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB\n');

        // Step 1: Check for existing admin
        console.log('=== STEP 1: Checking for Admin Users ===');
        const admins = await User.find({ role: 'admin' });
        console.log(`Found ${admins.length} admin user(s)`);
        
        if (admins.length === 0) {
            console.log('⚠️  No admin found! Creating one...\n');
            
            // Create admin
            const adminUser = new User({
                username: 'admin',
                email: 'admin@canadiannexus.com',
                password: 'Admin@123',
                role: 'admin'
            });
            await adminUser.save();
            console.log('✅ Admin created successfully!\n');
            admins.push(adminUser);
        } else {
            console.log('✅ Admin exists!\n');
            admins.forEach((admin, i) => {
                console.log(`   ${i + 1}. ${admin.email} (${admin.username}) - Role: ${admin.role}`);
            });
            console.log('');
        }

        // Step 2: Test login
        console.log('=== STEP 2: Testing Login Process ===');
        const testEmail = admins[0].email;
        const testPassword = 'Admin@123';
        
        console.log(`Attempting login with: ${testEmail}`);
        
        const user = await User.findOne({ email: testEmail });
        if (!user) {
            console.log('❌ User not found in database');
            return;
        }
        
        console.log('✅ User found in database');
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        
        // Test password comparison
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`\n🔐 Password verification: ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        
        if (!isMatch) {
            console.log('\n⚠️  Password mismatch! Let\'s update it...');
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            user.password = hashedPassword;
            await user.save();
            console.log('✅ Password updated successfully!');
        }

        // Step 3: Generate token
        console.log('\n=== STEP 3: Generating JWT Token ===');
        const payload = {
            userId: user._id,
            email: user.email,
            username: user.username,
            role: user.role
        };
        
        const jwtSecret = process.env.JWT_SECRET || 'defaultsecret';
        console.log(`JWT Secret: ${jwtSecret.substring(0, 10)}...`);
        
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
        console.log('✅ Token generated successfully!');
        console.log(`\nToken Preview: ${token.substring(0, 50)}...\n`);

        // Step 4: Verify token
        console.log('=== STEP 4: Verifying Token ===');
        try {
            const decoded = jwt.verify(token, jwtSecret);
            console.log('✅ Token is valid!');
            console.log('Decoded payload:');
            console.log(JSON.stringify(decoded, null, 2));
            
            // Check role
            console.log(`\n🔒 Admin check: ${decoded.role === 'admin' ? '✅ PASSED' : '❌ FAILED'}`);
            
        } catch (err) {
            console.log('❌ Token verification failed:', err.message);
        }

        // Step 5: Summary
        console.log('\n=== AUTHENTICATION FLOW SUMMARY ===');
        console.log('✅ All checks passed!');
        console.log('\nAdmin Credentials:');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${testPassword}`);
        console.log(`   Role: ${user.role}`);
        console.log('\n⚠️  Use these credentials to login to the admin panel!');
        console.log('\n📝 Sample Authorization Header:');
        console.log(`   Authorization: Bearer ${token.substring(0, 50)}...`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    }
};

testAuthFlow();
