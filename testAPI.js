const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test 1: Get all services
    console.log('1️⃣ Testing GET /api/services');
    const servicesResponse = await fetch(`${API_BASE_URL}/api/services`);
    const services = await servicesResponse.json();
    console.log(`✅ Success: Retrieved ${services.length} services`);
    console.log(`   First service: ${services[0]?.title}\n`);

    // Test 2: Get single service
    console.log('2️⃣ Testing GET /api/services/1');
    const serviceResponse = await fetch(`${API_BASE_URL}/api/services/1`);
    const service = await serviceResponse.json();
    console.log(`✅ Success: Retrieved service "${service.title}"`);
    console.log(`   Price: ${service.price}, Rating: ${service.rating}\n`);

    // Test 3: Get all reviews
    console.log('3️⃣ Testing GET /api/services/all/reviews');
    const reviewsResponse = await fetch(`${API_BASE_URL}/api/services/all/reviews`);
    const reviews = await reviewsResponse.json();
    console.log(`✅ Success: Retrieved ${reviews.length} reviews`);
    if (reviews.length > 0) {
      console.log(`   First review by: ${reviews[0].name}\n`);
    }

    console.log('✨ All API tests passed!\n');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.error('   Make sure the backend server is running on port 5000');
  }
}

testAPI();
