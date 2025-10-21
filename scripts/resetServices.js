const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Service = require('../models/Service');

const services = [
  {
    title: "Complete Settlement Package",
    category: "Settlement & Integration",
    description: "Step-by-step guidance for new immigrants with paperwork help, housing, healthcare, schools, and banking",
    aboutService: "Navigate your arrival in Canada with confidence through our comprehensive settlement package. We provide end-to-end support from the moment you arrive, helping you complete all essential paperwork and local registrations efficiently.",
    price: "$299",
    duration: "Full package",
    rating: 4.9,
    reviews: 187,
    consultant: "EXPERT 1",
    consultantTitle: "Settlement Specialist",
    features: ["Paperwork and local registrations", "Housing orientation", "Healthcare system navigation", "School enrollment guidance", "Banking setup assistance", "Follow-up support for 30 days"],
    icon: "Home"
  },
  {
    title: "Resume & LinkedIn Optimization",
    category: "Jobs & Career Coaching",
    description: "Professional resume and LinkedIn profile tailored to Canadian employers",
    aboutService: "Stand out in the competitive Canadian job market with a professionally optimized resume and LinkedIn profile. Our career experts understand what Canadian employers are looking for.",
    price: "$125",
    duration: "2 sessions",
    rating: 4.8,
    reviews: 243,
    consultant: "EXPERT 2",
    consultantTitle: "Career Coach",
    features: ["ATS-optimized resume", "LinkedIn profile makeover", "Cover letter templates", "Job search strategy guide", "Interview preparation tips", "Follow-up support for 14 days"],
    icon: "Briefcase"
  },
  {
    title: "Career Coaching & Interview Prep",
    category: "Jobs & Career Coaching",
    description: "1-on-1 coaching with interview preparation and networking support",
    aboutService: "Ace your Canadian job interviews with personalized one-on-one coaching from experienced career professionals.",
    price: "$150",
    duration: "Hourly",
    rating: 5.0,
    reviews: 156,
    consultant: "EXPERT 3",
    consultantTitle: "Career Coach & Interview Specialist",
    features: ["Mock interviews", "Behavioral question prep", "Salary negotiation tactics", "Networking strategies", "Personal branding guidance", "Follow-up support for 30 days"],
    icon: "Briefcase"
  },
  {
    title: "Business Registration & Setup",
    category: "Startup & Business",
    description: "Complete business registration and structuring in Canada",
    aboutService: "Launch your Canadian business with confidence through our comprehensive registration and setup service.",
    price: "$500",
    duration: "Full package",
    rating: 4.9,
    reviews: 89,
    consultant: "EXPERT 4",
    consultantTitle: "Business Registration Specialist",
    features: ["Business entity selection", "Registration process", "GST/HST setup", "Business bank account", "Legal structure advice", "Follow-up support for 30 days"],
    icon: "Rocket"
  },
  {
    title: "Startup Market Research",
    category: "Startup & Business",
    description: "Market research and go-to-market strategy guidance",
    aboutService: "Make data-driven decisions for your startup with professional market research and strategic planning.",
    price: "$350",
    duration: "3 sessions",
    rating: 4.7,
    reviews: 67,
    consultant: "EXPERT 5",
    consultantTitle: "Market Research Consultant",
    features: ["Market analysis", "Competitor research", "GTM strategy", "Pricing recommendations", "Target audience identification", "Follow-up support for 14 days"],
    icon: "Rocket"
  },
  {
    title: "Immigration Consultant Matching",
    category: "Immigration Agency Referral",
    description: "Connect with certified RCIC immigration consultants",
    aboutService: "Connect with trusted, certified Regulated Canadian Immigration Consultants (RCIC) who can handle your immigration needs professionally.",
    price: "$100",
    duration: "Consultation",
    rating: 5.0,
    reviews: 312,
    consultant: "EXPERT 6",
    consultantTitle: "Immigration Services Coordinator",
    features: ["Vetted RCIC consultants", "Free initial consultation", "Compliance guaranteed", "Documentation support", "Application guidance", "Follow-up support for 7 days"],
    icon: "FileText"
  },
  {
    title: "Housing Search Assistance",
    category: "Local & Household Support",
    description: "Find affordable housing with local expert guidance",
    aboutService: "Find your perfect home in Canada with expert guidance from local housing specialists.",
    price: "$75",
    duration: "Hourly",
    rating: 4.8,
    reviews: 134,
    consultant: "EXPERT 7",
    consultantTitle: "Housing Search Specialist",
    features: ["Neighborhood research", "Apartment viewings", "Lease negotiation", "Utilities setup help", "Moving logistics", "Follow-up support for 14 days"],
    icon: "Home"
  },
  {
    title: "Canadian Banking Setup",
    category: "Financial Setup",
    description: "Complete banking setup with credit building guidance",
    aboutService: "Establish your financial foundation in Canada with comprehensive banking and credit guidance.",
    price: "$99",
    duration: "Single session",
    rating: 4.9,
    reviews: 198,
    consultant: "EXPERT 8",
    consultantTitle: "Banking & Credit Specialist",
    features: ["Bank account opening", "Credit card application", "Credit score education", "Banking fee optimization", "Financial planning basics", "Follow-up support for 7 days"],
    icon: "DollarSign"
  },
  {
    title: "Tax ID & Filing Guidance",
    category: "Financial Setup",
    description: "SIN registration and first-year tax filing support",
    aboutService: "Navigate Canada's tax system with confidence through expert guidance on SIN registration and your first-year tax filing.",
    price: "$175",
    duration: "Full support",
    rating: 5.0,
    reviews: 145,
    consultant: "EXPERT 9",
    consultantTitle: "Tax & Financial Compliance Advisor",
    features: ["SIN application help", "Tax residency guidance", "First tax return filing", "Deduction optimization", "Tax planning strategies", "Follow-up support for 30 days"],
    icon: "DollarSign"
  },
  {
    title: "Work Permit & Labor Law",
    category: "Legal & Compliance",
    description: "Guidance on work permits, tenant rights, and labor laws",
    aboutService: "Understand your legal rights and obligations in Canada with expert consultation on work permits, tenant rights, and employment law.",
    price: "$200",
    duration: "Hourly",
    rating: 4.8,
    reviews: 87,
    consultant: "EXPERT 10",
    consultantTitle: "Legal & Compliance Consultant",
    features: ["Work permit guidance", "Tenant rights education", "Employment law basics", "Legal referrals", "Contract review assistance", "Follow-up support for 7 days"],
    icon: "Scale"
  },
  {
    title: "Provincial Health Card Setup",
    category: "Healthcare & Insurance",
    description: "Navigate Canada's healthcare system and get provincial coverage",
    aboutService: "Access Canada's healthcare system properly by obtaining your provincial health card and understanding how the system works.",
    price: "$50",
    duration: "Consultation",
    rating: 4.7,
    reviews: 223,
    consultant: "EXPERT 11",
    consultantTitle: "Healthcare Navigator",
    features: ["Health card application", "System orientation", "Doctor registration", "Emergency services info", "Insurance options overview", "Follow-up support for 7 days"],
    icon: "Heart"
  },
  {
    title: "School Admissions Support",
    category: "Education & Skill Upgrade",
    description: "Complete school enrollment and credential evaluation",
    aboutService: "Ensure your children receive the best education in Canada with comprehensive school admissions support.",
    price: "$150",
    duration: "Full package",
    rating: 4.9,
    reviews: 167,
    consultant: "EXPERT 12",
    consultantTitle: "Education Admissions Specialist",
    features: ["School research", "Application assistance", "Document translation", "Registration support", "Credential evaluation", "Follow-up support for 14 days"],
    icon: "GraduationCap"
  },
  {
    title: "Professional Reskilling Path",
    category: "Education & Skill Upgrade",
    description: "Diploma equivalency and career upgrade pathways",
    aboutService: "Advance your career in Canada through strategic reskilling and credential recognition.",
    price: "$200",
    duration: "3 sessions",
    rating: 5.0,
    reviews: 98,
    consultant: "EXPERT 13",
    consultantTitle: "Career Development Specialist",
    features: ["Credential assessment", "Career pathway planning", "Course recommendations", "Certification guidance", "Skills gap analysis", "Follow-up support for 14 days"],
    icon: "GraduationCap"
  },
  {
    title: "Newcomer Community Network",
    category: "Networking & Community",
    description: "Connect with cultural communities and find mentorship",
    aboutService: "Build your social and professional network in Canada through our newcomer community connections.",
    price: "$100",
    duration: "Ongoing",
    rating: 4.8,
    reviews: 456,
    consultant: "EXPERT 14",
    consultantTitle: "Community Engagement Coordinator",
    features: ["Meetup invitations", "Mentor matching", "Cultural events", "Volunteer opportunities", "Networking events access", "Follow-up support for 30 days"],
    icon: "Users"
  },
  {
    title: "Airport Pickup & Setup",
    category: "Relocation & Logistics",
    description: "Complete arrival support with temporary accommodation",
    aboutService: "Start your Canadian journey stress-free with our comprehensive arrival support package.",
    price: "$350",
    duration: "Full package",
    rating: 4.9,
    reviews: 234,
    consultant: "EXPERT 15",
    consultantTitle: "Arrival Support Specialist",
    features: ["Airport pickup", "Temporary accommodation", "SIM card setup", "Essential shopping tour", "Orientation session", "Follow-up support for 7 days"],
    icon: "Truck"
  },
  {
    title: "Digital ID & Apps Setup",
    category: "Digital Transition",
    description: "Complete digital transition with ID applications and essential apps",
    aboutService: "Navigate Canada's digital landscape with expert assistance in obtaining your provincial ID, driver's license, and setting up essential apps.",
    price: "$99",
    duration: "2 sessions",
    rating: 4.7,
    reviews: 189,
    consultant: "EXPERT 16",
    consultantTitle: "Digital Onboarding Specialist",
    features: ["Provincial ID application", "Driver's license guidance", "Essential apps setup", "Cyber-safety training", "Online services navigation", "Follow-up support for 14 days"],
    icon: "Smartphone"
  }
];

async function resetServices() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Deleting all existing services...');
    const deleteResult = await Service.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} services`);

    console.log('\n📝 Adding new services...');
    const result = await Service.insertMany(services);
    console.log(`✅ Added ${result.length} services`);

    console.log('\n📋 Service IDs:');
    result.forEach(service => {
      console.log(`- ${service.title}: ${service._id}`);
    });

    console.log('\n✅ Reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

resetServices();
