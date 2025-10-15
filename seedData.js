const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('./models/Service');
const Review = require('./models/Review');

dotenv.config();

// Service data
const serviceData = {
  1: {
    title: "Complete Settlement Package",
    category: "Settlement & Integration",
    description: "Step-by-step guidance for new immigrants with paperwork help, housing, healthcare, schools, and banking",
    aboutService: "Navigate your arrival in Canada with confidence through our comprehensive settlement package. We provide end-to-end support from the moment you arrive, helping you complete all essential paperwork and local registrations efficiently. Our experts guide you through finding suitable housing, understanding Canada's healthcare system, enrolling children in schools, and setting up your banking. This package is designed to eliminate the stress of settling in a new country, ensuring you have all the foundational elements in place for a successful Canadian journey.",
    price: "$299",
    duration: "Full package",
    rating: 4.9,
    reviews: 187,
    consultant: "EXPERT 1",
    consultantTitle: "Settlement Specialist",
    icon: "Home",
    features: [
      "Paperwork and local registrations",
      "Housing orientation",
      "Healthcare system navigation",
      "School enrollment guidance",
      "Banking setup assistance",
      "Follow-up support for 30 days",
    ],
  },
  2: {
    title: "Resume & LinkedIn Optimization",
    category: "Jobs & Career Coaching",
    description: "Professional resume and LinkedIn profile tailored to Canadian employers",
    aboutService: "Stand out in the competitive Canadian job market with a professionally optimized resume and LinkedIn profile. Our career experts understand what Canadian employers are looking for and will transform your documents to meet Applicant Tracking System (ATS) requirements. We'll revamp your LinkedIn profile to maximize visibility, create compelling cover letter templates, and provide you with a strategic job search guide tailored to your industry and experience level.",
    price: "$125",
    duration: "2 sessions",
    rating: 4.8,
    reviews: 243,
    consultant: "EXPERT 2",
    consultantTitle: "Career Coach",
    icon: "Briefcase",
    features: [
      "ATS-optimized resume",
      "LinkedIn profile makeover",
      "Cover letter templates",
      "Job search strategy guide",
      "Interview preparation tips",
      "Follow-up support for 14 days",
    ],
  },
  3: {
    title: "Career Coaching & Interview Prep",
    category: "Jobs & Career Coaching",
    description: "1-on-1 coaching with interview preparation and networking support",
    aboutService: "Ace your Canadian job interviews with personalized one-on-one coaching from experienced career professionals. We conduct realistic mock interviews, teach you how to answer behavioral questions effectively, and provide proven salary negotiation tactics. Learn powerful networking strategies and personal branding techniques that will help you build professional connections and advance your career in Canada. This hands-on coaching prepares you for real-world scenarios you'll face in the Canadian job market.",
    price: "$150/hour",
    duration: "Hourly",
    rating: 5.0,
    reviews: 156,
    consultant: "EXPERT 3",
    consultantTitle: "Career Coach & Interview Specialist",
    icon: "Briefcase",
    features: [
      "Mock interviews",
      "Behavioral question prep",
      "Salary negotiation tactics",
      "Networking strategies",
      "Personal branding guidance",
      "Follow-up support for 30 days",
    ],
  },
  4: {
    title: "Business Registration & Setup",
    category: "Startup & Business",
    description: "Complete business registration and structuring in Canada",
    aboutService: "Launch your Canadian business with confidence through our comprehensive registration and setup service. We guide you through selecting the right business entity structure, completing all registration paperwork, setting up GST/HST accounts, and establishing your business banking. Our experts ensure you understand compliance requirements and help you make informed decisions about your business structure that will benefit you long-term. Perfect for entrepreneurs ready to start their business journey in Canada.",
    price: "$500",
    duration: "Full package",
    rating: 4.9,
    reviews: 89,
    consultant: "EXPERT 4",
    consultantTitle: "Business Registration Specialist",
    icon: "Rocket",
    features: [
      "Business entity selection",
      "Registration process",
      "GST/HST setup",
      "Business bank account",
      "Legal structure advice",
      "Follow-up support for 30 days",
    ],
  },
  5: {
    title: "Startup Market Research",
    category: "Startup & Business",
    description: "Market research and go-to-market strategy guidance",
    aboutService: "Make data-driven decisions for your startup with professional market research and strategic planning. We conduct comprehensive market analysis, identify your competition, and help you develop a winning go-to-market strategy. Our research includes pricing recommendations and target audience identification to position your business for success in the Canadian market. This service is essential for entrepreneurs who want to minimize risk and maximize their chances of business success.",
    price: "$350",
    duration: "3 sessions",
    rating: 4.7,
    reviews: 67,
    consultant: "EXPERT 5",
    consultantTitle: "Market Research Consultant",
    icon: "Rocket",
    features: [
      "Market analysis",
      "Competitor research",
      "GTM strategy",
      "Pricing recommendations",
      "Target audience identification",
      "Follow-up support for 14 days",
    ],
  },
  6: {
    title: "Immigration Consultant Matching",
    category: "Immigration Agency Referral",
    description: "Connect with certified RCIC immigration consultants",
    aboutService: "Connect with trusted, certified Regulated Canadian Immigration Consultants (RCIC) who can handle your immigration needs professionally. We match you with vetted consultants who specialize in your specific immigration pathway. Receive a free initial consultation to discuss your case, and benefit from guaranteed compliance with Canadian immigration regulations. Our network of consultants provides comprehensive documentation support and application guidance to maximize your success.",
    price: "$Free matching",
    duration: "Consultation",
    rating: 5.0,
    reviews: 312,
    consultant: "EXPERT 6",
    consultantTitle: "Immigration Services Coordinator",
    icon: "FileText",
    features: [
      "Vetted RCIC consultants",
      "Free initial consultation",
      "Compliance guaranteed",
      "Documentation support",
      "Application guidance",
      "Follow-up support for 7 days",
    ],
  },
  7: {
    title: "Housing Search Assistance",
    category: "Local & Household Support",
    description: "Find affordable housing with local expert guidance",
    aboutService: "Find your perfect home in Canada with expert guidance from local housing specialists. We help you research neighborhoods, attend apartment viewings, negotiate favorable lease terms, and set up all necessary utilities. Our service includes moving logistics support to make your transition smooth and stress-free. Whether you're looking for temporary or permanent accommodation, we ensure you find safe, affordable housing that meets your family's needs.",
    price: "$75/hour",
    duration: "Hourly",
    rating: 4.8,
    reviews: 134,
    consultant: "EXPERT 7",
    consultantTitle: "Housing Search Specialist",
    icon: "Home",
    features: [
      "Neighborhood research",
      "Apartment viewings",
      "Lease negotiation",
      "Utilities setup help",
      "Moving logistics",
      "Follow-up support for 14 days",
    ],
  },
  8: {
    title: "Canadian Banking Setup",
    category: "Financial Setup",
    description: "Complete banking setup with credit building guidance",
    aboutService: "Establish your financial foundation in Canada with comprehensive banking and credit guidance. We assist you in opening the right bank accounts, applying for credit cards, and understanding how to build your Canadian credit score from scratch. Learn about banking fee optimization and basic financial planning to manage your money effectively. This service is crucial for newcomers who want to establish strong financial roots in Canada.",
    price: "$99",
    duration: "Single session",
    rating: 4.9,
    reviews: 198,
    consultant: "EXPERT 8",
    consultantTitle: "Banking & Credit Specialist",
    icon: "DollarSign",
    features: [
      "Bank account opening",
      "Credit card application",
      "Credit score education",
      "Banking fee optimization",
      "Financial planning basics",
      "Follow-up support for 7 days",
    ],
  },
  9: {
    title: "Tax ID & Filing Guidance",
    category: "Financial Setup",
    description: "SIN registration and first-year tax filing support",
    aboutService: "Navigate Canada's tax system with confidence through expert guidance on SIN registration and your first-year tax filing. We help you understand tax residency requirements, guide you through applying for your Social Insurance Number, and provide comprehensive support for filing your first Canadian tax return. Learn deduction optimization strategies and tax planning techniques to maximize your returns and ensure full compliance with Canadian tax laws.",
    price: "$175",
    duration: "Full support",
    rating: 5.0,
    reviews: 145,
    consultant: "EXPERT 9",
    consultantTitle: "Tax & Financial Compliance Advisor",
    icon: "DollarSign",
    features: [
      "SIN application help",
      "Tax residency guidance",
      "First tax return filing",
      "Deduction optimization",
      "Tax planning strategies",
      "Follow-up support for 30 days",
    ],
  },
  10: {
    title: "Work Permit & Labor Law",
    category: "Legal & Compliance",
    description: "Guidance on work permits, tenant rights, and labor laws",
    aboutService: "Understand your legal rights and obligations in Canada with expert consultation on work permits, tenant rights, and employment law. We provide clear guidance on work permit requirements, educate you about your rights as a tenant, cover employment law basics, and offer legal referrals when needed. Our consultants also assist with contract review to ensure you're protected in all your legal agreements. Essential for anyone navigating legal matters in Canada.",
    price: "$200/hour",
    duration: "Hourly",
    rating: 4.8,
    reviews: 87,
    consultant: "EXPERT 10",
    consultantTitle: "Legal & Compliance Consultant",
    icon: "Scale",
    features: [
      "Work permit guidance",
      "Tenant rights education",
      "Employment law basics",
      "Legal referrals",
      "Contract review assistance",
      "Follow-up support for 7 days",
    ],
  },
  11: {
    title: "Provincial Health Card Setup",
    category: "Healthcare & Insurance",
    description: "Navigate Canada's healthcare system and get provincial coverage",
    aboutService: "Access Canada's healthcare system properly by obtaining your provincial health card and understanding how the system works. We guide you through the health card application process, provide comprehensive system orientation, help you register with a family doctor, explain emergency services, and overview insurance options to supplement your provincial coverage. This service ensures you and your family have access to the healthcare you need.",
    price: "$50",
    duration: "Consultation",
    rating: 4.7,
    reviews: 223,
    consultant: "EXPERT 11",
    consultantTitle: "Healthcare Navigator",
    icon: "Heart",
    features: [
      "Health card application",
      "System orientation",
      "Doctor registration",
      "Emergency services info",
      "Insurance options overview",
      "Follow-up support for 7 days",
    ],
  },
  12: {
    title: "School Admissions Support",
    category: "Education & Skill Upgrade",
    description: "Complete school enrollment and credential evaluation",
    aboutService: "Ensure your children receive the best education in Canada with comprehensive school admissions support. We help you research and select appropriate schools, assist with applications, handle document translation requirements, and guide you through the registration process. Our service includes credential evaluation to ensure your children are placed in the right grade level. We make the school enrollment process smooth and stress-free for your family.",
    price: "$150",
    duration: "Full package",
    rating: 4.9,
    reviews: 167,
    consultant: "EXPERT 12",
    consultantTitle: "Education Admissions Specialist",
    icon: "GraduationCap",
    features: [
      "School research",
      "Application assistance",
      "Document translation",
      "Registration support",
      "Credential evaluation",
      "Follow-up support for 14 days",
    ],
  },
  13: {
    title: "Professional Reskilling Path",
    category: "Education & Skill Upgrade",
    description: "Diploma equivalency and career upgrade pathways",
    aboutService: "Advance your career in Canada through strategic reskilling and credential recognition. We conduct thorough credential assessments, create personalized career pathway plans, recommend relevant courses and programs, provide certification guidance, and perform skills gap analysis. This service is perfect for professionals who want to leverage their international experience while meeting Canadian industry standards and requirements.",
    price: "$200",
    duration: "3 sessions",
    rating: 5.0,
    reviews: 98,
    consultant: "EXPERT 13",
    consultantTitle: "Career Development Specialist",
    icon: "GraduationCap",
    features: [
      "Credential assessment",
      "Career pathway planning",
      "Course recommendations",
      "Certification guidance",
      "Skills gap analysis",
      "Follow-up support for 14 days",
    ],
  },
  14: {
    title: "Newcomer Community Network",
    category: "Networking & Community",
    description: "Connect with cultural communities and find mentorship",
    aboutService: "Build your social and professional network in Canada through our newcomer community connections. We provide meetup invitations to connect with people from your cultural background, match you with experienced mentors, share information about cultural events, identify volunteer opportunities, and give you access to networking events. This free service helps you combat isolation and build a support system in your new home.",
    price: "$Free",
    duration: "Ongoing",
    rating: 4.8,
    reviews: 456,
    consultant: "EXPERT 14",
    consultantTitle: "Community Engagement Coordinator",
    icon: "Users",
    features: [
      "Meetup invitations",
      "Mentor matching",
      "Cultural events",
      "Volunteer opportunities",
      "Networking events access",
      "Follow-up support for 30 days",
    ],
  },
  15: {
    title: "Airport Pickup & Setup",
    category: "Relocation & Logistics",
    description: "Complete arrival support with temporary accommodation",
    aboutService: "Start your Canadian journey stress-free with our comprehensive arrival support package. We provide airport pickup, arrange temporary accommodation, help you get a SIM card, take you on an essential shopping tour, and conduct a thorough orientation session. This all-inclusive service ensures your first days in Canada are comfortable and you have everything you need to begin settling in immediately.",
    price: "$350",
    duration: "Full package",
    rating: 4.9,
    reviews: 234,
    consultant: "EXPERT 15",
    consultantTitle: "Arrival Support Specialist",
    icon: "Truck",
    features: [
      "Airport pickup",
      "Temporary accommodation",
      "SIM card setup",
      "Essential shopping tour",
      "Orientation session",
      "Follow-up support for 7 days",
    ],
  },
  16: {
    title: "Digital ID & Apps Setup",
    category: "Digital Transition",
    description: "Complete digital transition with ID applications and essential apps",
    aboutService: "Navigate Canada's digital landscape with expert assistance in obtaining your provincial ID, driver's license, and setting up essential apps. We guide you through the online ID application process, provide driver's license guidance, help you set up essential Canadian apps, deliver cyber-safety training, and teach you how to navigate online services. This service ensures you're digitally connected and secure in your new country.",
    price: "$99",
    duration: "2 sessions",
    rating: 4.7,
    reviews: 189,
    consultant: "EXPERT 16",
    consultantTitle: "Digital Onboarding Specialist",
    icon: "Smartphone",
    features: [
      "Provincial ID application",
      "Driver's license guidance",
      "Essential apps setup",
      "Cyber-safety training",
      "Online services navigation",
      "Follow-up support for 14 days",
    ],
  },
};

// Reviews data
const reviewsData = [
  {
    name: "Sarah Thompson",
    rating: 5,
    date: "2 weeks ago",
    comment: "Exceptional service! The consultant was incredibly knowledgeable and patient. They helped me understand all my options and made the process so much easier.",
  },
  {
    name: "Michael Rodriguez",
    rating: 5,
    date: "3 weeks ago",
    comment: "Highly recommend! Professional, thorough, and very helpful. Got exactly what I needed and the follow-up support was excellent.",
  },
  {
    name: "Priya Patel",
    rating: 4,
    date: "1 month ago",
    comment: "Great experience overall. The consultant was well-informed and provided valuable insights. Would definitely use again.",
  },
  {
    name: "James Chen",
    rating: 5,
    date: "1 month ago",
    comment: "Outstanding! They went above and beyond to ensure everything was perfect. Very pleased with the service.",
  },
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  seedDatabase();
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Seed function
async function seedDatabase() {
  try {
    console.log('\n🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing services...');
    await Service.deleteMany({});
    console.log('✅ Services cleared');

    console.log('🗑️  Clearing existing reviews...');
    await Review.deleteMany({});
    console.log('✅ Reviews cleared\n');

    // Insert services
    console.log('📦 Inserting services...');
    const services = [];
    for (const [key, value] of Object.entries(serviceData)) {
      services.push({
        serviceId: parseInt(key),
        ...value,
      });
    }
    
    const insertedServices = await Service.insertMany(services);
    console.log(`✅ Successfully inserted ${insertedServices.length} services\n`);

    // Insert reviews
    console.log('💬 Inserting reviews...');
    const insertedReviews = await Review.insertMany(reviewsData);
    console.log(`✅ Successfully inserted ${insertedReviews.length} reviews\n`);

    // Display summary
    console.log('📊 Database Seeding Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`Services: ${insertedServices.length}`);
    console.log(`Reviews: ${insertedReviews.length}`);
    console.log('═══════════════════════════════════════');
    console.log('\n✨ Database seeding completed successfully!\n');

    // Close connection
    mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}
