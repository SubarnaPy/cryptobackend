const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const productsData = [
  // Ebooks
  {
    title: "Canadian Tax Basics for Newcomers",
    description: "Demystifying Canadian taxes with simple explanations of tax filing, deductions, credits, and important deadlines for new residents.",
    price: 0,
    type: "ebook",
    category: "finance"
  },
  {
    title: "Getting Your SIN Number: A Complete Guide",
    description: "Everything you need to know about obtaining your Social Insurance Number in Canada. Step-by-step instructions, required documents, and common mistakes to avoid.",
    price: 0,
    type: "ebook",
    category: "settlement"
  },
  {
    title: "Opening Your First Canadian Bank Account",
    description: "A comprehensive guide to choosing the right bank, understanding account types, and setting up your finances in Canada as a newcomer.",
    price: 0,
    type: "ebook",
    category: "finance"
  },
  {
    title: "Understanding Canadian Healthcare System",
    description: "Navigate the Canadian healthcare system with confidence. Learn about provincial health cards, finding doctors, and accessing medical services.",
    price: 0,
    type: "ebook",
    category: "settlement"
  },
  {
    title: "Finding Your First Job in Canada",
    description: "Proven strategies for job hunting in Canada including resume writing, networking tips, and interview preparation tailored for newcomers.",
    price: 0,
    type: "ebook",
    category: "career"
  },
  {
    title: "Renting an Apartment: Newcomer's Guide",
    description: "Everything about renting in Canada - from understanding lease agreements to tenant rights, finding apartments, and moving tips.",
    price: 0,
    type: "ebook",
    category: "settlement"
  },
  // Courses
  {
    title: "Canadian Immigration Pathways Explained",
    description: "Comprehensive overview of Canadian immigration programs including Express Entry, PNP, family sponsorship, and study permits. Understand your options and plan your pathway to permanent residency.",
    price: 99.99,
    type: "course",
    category: "immigration"
  },
  {
    title: "Mastering Canadian Job Interviews",
    description: "Learn the art of Canadian job interviews with expert tips on answering behavioral questions, understanding workplace culture, and making a great first impression. Includes mock interview sessions and real examples.",
    price: 0,
    type: "course",
    category: "career"
  },
  {
    title: "Canadian Resume Writing Workshop",
    description: "Transform your resume into a powerful tool that gets noticed by Canadian employers. Learn formatting standards, keyword optimization, and how to highlight your international experience effectively.",
    price: 0,
    type: "course",
    category: "career"
  },
  {
    title: "Networking Like a Pro in Canada",
    description: "Build meaningful professional connections in the Canadian job market. Master LinkedIn strategies, informational interviews, and networking events to accelerate your career growth.",
    price: 49.99,
    type: "course",
    category: "career"
  },
  {
    title: "Understanding Canadian Workplace Culture",
    description: "Navigate the nuances of Canadian workplace expectations, communication styles, and professional etiquette. Essential for international professionals transitioning to Canadian work environments.",
    price: 0,
    type: "course",
    category: "career"
  },
  {
    title: "Financial Planning for Newcomers",
    description: "Master Canadian personal finance including budgeting, credit building, RRSP, TFSA, and investment basics. Build a solid financial foundation for your Canadian journey.",
    price: 79.99,
    type: "course",
    category: "finance"
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Product.deleteMany({});
    console.log('Cleared existing products');

    const products = await Product.insertMany(productsData);
    console.log(`✅ Seeded ${products.length} products`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
