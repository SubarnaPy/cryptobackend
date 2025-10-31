const mongoose = require('mongoose');
const Consultation = require('./models/Consultation');

async function debugConsultations() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/canadian_nexus', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🔍 Checking all consultations in database...');

    // Get all consultations
    const allConsultations = await Consultation.find({});
    console.log(`📊 Total consultations found: ${allConsultations.length}`);

    // Group by serviceType
    const serviceTypeCounts = {};
    allConsultations.forEach(consultation => {
      const serviceType = consultation.serviceType || 'null/undefined';
      serviceTypeCounts[serviceType] = (serviceTypeCounts[serviceType] || 0) + 1;
    });

    console.log('📈 Service type distribution:');
    Object.entries(serviceTypeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} consultations`);
    });

    // Check status distribution
    const statusCounts = {};
    allConsultations.forEach(consultation => {
      const status = consultation.status || 'null/undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📋 Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} consultations`);
    });

    // Check consultations with status 'confirmed' or 'completed'
    const validConsultations = allConsultations.filter(c =>
      ['confirmed', 'completed'].includes(c.status) && c.serviceType
    );

    console.log(`✅ Valid consultations (confirmed/completed with serviceType): ${validConsultations.length}`);

    const validServiceTypes = {};
    validConsultations.forEach(consultation => {
      const serviceType = consultation.serviceType;
      validServiceTypes[serviceType] = (validServiceTypes[serviceType] || 0) + 1;
    });

    console.log('📊 Valid service type distribution:');
    Object.entries(validServiceTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} consultations`);
    });

    // Show sample data
    if (allConsultations.length > 0) {
      console.log('📝 Sample consultation data:');
      console.log(JSON.stringify(allConsultations.slice(0, 3), null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugConsultations();