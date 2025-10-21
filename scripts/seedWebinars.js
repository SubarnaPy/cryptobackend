const mongoose = require('mongoose');
const Webinar = require('../models/Webinar');
require('dotenv').config();

const webinarsData = [
  {
    title: "Express Entry: Your Path to Canadian PR",
    description: "Learn everything about Express Entry system, CRS score calculation, and how to improve your chances of getting an Invitation to Apply (ITA).",
    date: "2025-11-15",
    time: "14:00:00",
    duration_minutes: 90,
    speaker_name: "Sarah Johnson",
    speaker_title: "Senior Immigration Consultant",
    status: "upcoming"
  },
  {
    title: "Starting Your Business in Canada",
    description: "Comprehensive guide to business registration, incorporation, tax setup, and accessing startup funding programs in Canada.",
    date: "2025-11-22",
    time: "18:00:00",
    duration_minutes: 60,
    speaker_name: "Michael Chen",
    speaker_title: "Business Development Advisor",
    status: "upcoming"
  },
  {
    title: "Canadian Job Market 2025",
    description: "Insights into the Canadian job market, in-demand professions, resume tips, and networking strategies for newcomers.",
    date: "2025-11-29",
    time: "16:00:00",
    duration_minutes: 75,
    speaker_name: "Emily Rodriguez",
    speaker_title: "Career Coach & Recruiter",
    status: "upcoming"
  }
];

async function seedWebinars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Webinar.deleteMany({});
    console.log('Cleared existing webinars');

    const webinars = await Webinar.insertMany(webinarsData);
    console.log(`✅ Seeded ${webinars.length} webinars`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding webinars:', error);
    process.exit(1);
  }
}

seedWebinars();
