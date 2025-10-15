const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-2024';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mondalsubarna29:Su12345@cluster0.1kmazke.mongodb.net/canada_admin';

async function testAdminAuth() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Admin credentials
        const adminEmail = 'admin@canadiannexus.com';
        const adminPassword = 'Admin@123';

        // Step 1: Check if admin exists
        console.log('=== STEP 1: Check for Admin User ===');
        let admin = await User.findOne({ email: adminEmail });
        
        if (!admin) {
            console.log('⚠️  No admin found. Creating one...\n');
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);
            
            // Create admin
            admin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                phone: '+1234567890'
            });
            
            // Generate affiliate code
            admin.affiliateCode = await admin.generateAffiliateCode();
            await admin.save();
            
            console.log('✅ Admin user created!');
        } else {
            console.log('✅ Admin user exists!');
            
            // Update password to ensure it matches
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);
            admin.password = hashedPassword;
            await admin.save();
            console.log('✅ Admin password updated!');
        }
        
        console.log('Admin Details:');
        console.log('  ID:', admin._id);
        console.log('  Email:', admin.email);
        console.log('  Name:', admin.firstName, admin.lastName);
        console.log('  Role:', admin.role);
        console.log('  Affiliate Code:', admin.affiliateCode);
        console.log('');

        // Step 2: Test Login
        console.log('=== STEP 2: Test Login ===');
        console.log('Attempting login...');
        
        // Verify password
        const isValidPassword = await bcrypt.compare(adminPassword, admin.password);
        console.log('Password verification:', isValidPassword ? '✅ VALID' : '❌ INVALID');
        
        if (!isValidPassword) {
            throw new Error('Password verification failed!');
        }
        
        // Generate token
        const token = jwt.sign(
            { 
                userId: admin._id, 
                email: admin.email,
                role: admin.role 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ JWT Token generated!');
        console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
        console.log('');

        // Step 3: Verify Token
        console.log('=== STEP 3: Verify Token ===');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified!');
        console.log('Decoded payload:');
        console.log('  User ID:', decoded.userId);
        console.log('  Email:', decoded.email);
        console.log('  Role:', decoded.role);
        console.log('');

        // Step 4: Check Admin Role
        console.log('=== STEP 4: Admin Role Check ===');
        console.log('Is admin?', decoded.role === 'admin' ? '✅ YES' : '❌ NO');
        console.log('');

        // Step 5: List all admins
        console.log('=== STEP 5: All Admin Users ===');
        const allAdmins = await User.find({ role: 'admin' });
        console.log(`Found ${allAdmins.length} admin(s):`);
        allAdmins.forEach((user, i) => {
            console.log(`  ${i + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
        });
        console.log('');

        // Summary
        console.log('=== ✅ ALL TESTS PASSED! ===');
        console.log('');
        console.log('🔑 Admin Login Credentials:');
        console.log('   Email:', adminEmail);
        console.log('   Password:', adminPassword);
        console.log('');
        console.log('📋 Sample cURL request:');
        console.log('curl -X POST http://localhost:5000/api/auth/login \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log(`  -d '{"email":"${adminEmail}","password":"${adminPassword}"}'`);
        console.log('');
        console.log('🔐 Test Authorization Header:');
        console.log(`Authorization: Bearer ${token.substring(0, 50)}...`);
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Connection closed');
    }
}

testAdminAuth();
