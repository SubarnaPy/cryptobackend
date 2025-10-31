const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Consultation = require('../models/Consultation');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Service = require('../models/Service');

dotenv.config();

const seedAnalyticsData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus');

    console.log('🌱 Seeding analytics test data...');

    // Clear existing data
    await Consultation.deleteMany({});
    await Purchase.deleteMany({});
    await Payment.deleteMany({});
    await Product.deleteMany({});
    await Service.deleteMany({});

    // Create sample services
    const services = await Service.insertMany([
      {
        title: "Complete Settlement Package",
        category: "Settlement & Integration",
        price: 299,
        rating: 4.9,
        reviews: 187
      },
      {
        title: "Resume & LinkedIn Optimization",
        category: "Jobs & Career Coaching",
        price: 125,
        rating: 4.8,
        reviews: 243
      }
    ]);

    // Create sample products
    const products = await Product.insertMany([
      {
        title: "Canadian Immigration Guide Ebook",
        type: "ebook",
        category: "Immigration",
        price: 49.99,
        description: "Comprehensive guide to Canadian immigration"
      },
      {
        title: "Job Search Mastery Course",
        type: "course",
        category: "Career",
        price: 199.99,
        description: "Complete course on job searching in Canada"
      }
    ]);

    // Create sample payments for consultations
    const consultationPayments = await Payment.insertMany([
      { amount: 299, status: 'completed', createdAt: new Date('2024-01-15') },
      { amount: 125, status: 'completed', createdAt: new Date('2024-02-10') },
      { amount: 299, status: 'completed', createdAt: new Date('2024-03-05') },
      { amount: 125, status: 'completed', createdAt: new Date('2024-03-20') },
      { amount: 299, status: 'completed', createdAt: new Date('2024-04-12') }
    ]);

    // Create sample consultations
    const consultations = await Consultation.insertMany([
      {
        consultationType: "Complete Settlement Package",
        name: "John Doe",
        email: "john@example.com",
        status: "completed",
        paymentId: consultationPayments[0]._id,
        createdAt: new Date('2024-01-15')
      },
      {
        consultationType: "Resume & LinkedIn Optimization",
        name: "Jane Smith",
        email: "jane@example.com",
        status: "completed",
        paymentId: consultationPayments[1]._id,
        createdAt: new Date('2024-02-10')
      },
      {
        consultationType: "Complete Settlement Package",
        name: "Mike Johnson",
        email: "mike@example.com",
        status: "completed",
        paymentId: consultationPayments[2]._id,
        createdAt: new Date('2024-03-05')
      },
      {
        consultationType: "Resume & LinkedIn Optimization",
        name: "Sarah Wilson",
        email: "sarah@example.com",
        status: "completed",
        paymentId: consultationPayments[3]._id,
        createdAt: new Date('2024-03-20')
      },
      {
        consultationType: "Complete Settlement Package",
        name: "David Brown",
        email: "david@example.com",
        status: "completed",
        paymentId: consultationPayments[4]._id,
        createdAt: new Date('2024-04-12')
      }
    ]);

    // Update payments with consultation IDs
    await Payment.findByIdAndUpdate(consultationPayments[0]._id, { consultationId: consultations[0]._id });
    await Payment.findByIdAndUpdate(consultationPayments[1]._id, { consultationId: consultations[1]._id });
    await Payment.findByIdAndUpdate(consultationPayments[2]._id, { consultationId: consultations[2]._id });
    await Payment.findByIdAndUpdate(consultationPayments[3]._id, { consultationId: consultations[3]._id });
    await Payment.findByIdAndUpdate(consultationPayments[4]._id, { consultationId: consultations[4]._id });

    // Create sample payments for products
    const productPayments = await Payment.insertMany([
      { amount: 49.99, status: 'completed', createdAt: new Date('2024-01-20') },
      { amount: 199.99, status: 'completed', createdAt: new Date('2024-02-15') },
      { amount: 49.99, status: 'completed', createdAt: new Date('2024-03-10') },
      { amount: 199.99, status: 'completed', createdAt: new Date('2024-03-25') },
      { amount: 49.99, status: 'completed', createdAt: new Date('2024-04-15') },
      { amount: 199.99, status: 'completed', createdAt: new Date('2024-04-20') }
    ]);

    // Create sample purchases
    const purchases = await Purchase.insertMany([
      {
        itemId: products[0]._id,
        itemType: 'product',
        quantity: 1,
        price: 49.99,
        paymentId: productPayments[0]._id,
        createdAt: new Date('2024-01-20')
      },
      {
        itemId: products[1]._id,
        itemType: 'product',
        quantity: 1,
        price: 199.99,
        paymentId: productPayments[1]._id,
        createdAt: new Date('2024-02-15')
      },
      {
        itemId: products[0]._id,
        itemType: 'product',
        quantity: 1,
        price: 49.99,
        paymentId: productPayments[2]._id,
        createdAt: new Date('2024-03-10')
      },
      {
        itemId: products[1]._id,
        itemType: 'product',
        quantity: 1,
        price: 199.99,
        paymentId: productPayments[3]._id,
        createdAt: new Date('2024-03-25')
      },
      {
        itemId: products[0]._id,
        itemType: 'product',
        quantity: 1,
        price: 49.99,
        paymentId: productPayments[4]._id,
        createdAt: new Date('2024-04-15')
      },
      {
        itemId: products[1]._id,
        itemType: 'product',
        quantity: 1,
        price: 199.99,
        paymentId: productPayments[5]._id,
        createdAt: new Date('2024-04-20')
      }
    ]);

    console.log('✅ Analytics test data seeded successfully!');
    console.log(`📊 Created ${consultations.length} consultations and ${purchases.length} purchases`);

  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAnalyticsData();