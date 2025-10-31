const mongoose = require('mongoose');
const Consultation = require('./models/Consultation');

async function checkConsultationTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus');

    console.log('🔍 Checking consultation types in database...');

    const types = await Consultation.distinct('consultationType');
    console.log('Available consultation types:', types);

    const sampleConsultations = await Consultation.find({}).limit(5).select('consultationType status');
    console.log('Sample consultations:', sampleConsultations.map(c => ({ type: c.consultationType, status: c.status })));

    const confirmedCompleted = await Consultation.find({
      status: { $in: ['confirmed', 'completed'] },
      consultationType: { $ne: null, $exists: true }
    }).select('consultationType status');

    console.log('Confirmed/Completed consultations:', confirmedCompleted.length);
    console.log('By type:', confirmedCompleted.reduce((acc, c) => {
      acc[c.consultationType] = (acc[c.consultationType] || 0) + 1;
      return acc;
    }, {}));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkConsultationTypes();