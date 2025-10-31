const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'your-admin-jwt-token-here'; // You'll need to get this from the frontend

async function testAnalyticsEndpoints() {
  console.log('🧪 Testing Analytics Endpoints...\n');

  const headers = {
    Authorization: `Bearer ${ADMIN_TOKEN}`
  };

  try {
    // Test Services Analytics
    console.log('📊 Testing Services Analytics...');
    const servicesResponse = await axios.get(`${API_BASE_URL}/admin/analytics/services`, { headers });
    console.log('✅ Services Analytics Success:');
    console.log('   Data keys:', Object.keys(servicesResponse.data.data));
    console.log('   Service breakdown count:', servicesResponse.data.data.serviceBreakdown.length);
    console.log('   Total bookings:', servicesResponse.data.data.totalBookings);
    console.log('');

    // Test Courses/Products Analytics
    console.log('📚 Testing Courses/Products Analytics...');
    const productsResponse = await axios.get(`${API_BASE_URL}/admin/analytics/courses-products`, { headers });
    console.log('✅ Courses/Products Analytics Success:');
    console.log('   Data keys:', Object.keys(productsResponse.data.data));
    console.log('   Product sales count:', productsResponse.data.data.productSales.length);
    console.log('   Total sales:', productsResponse.data.data.totalSales);
    console.log('');

    // Test Combined Analytics
    console.log('📈 Testing Combined Analytics...');
    const combinedResponse = await axios.get(`${API_BASE_URL}/admin/analytics/combined`, { headers });
    console.log('✅ Combined Analytics Success:');
    console.log('   Data keys:', Object.keys(combinedResponse.data.data));
    console.log('   Services revenue:', combinedResponse.data.data.services.totalRevenue);
    console.log('   Products revenue:', combinedResponse.data.data.products.totalRevenue);
    console.log('');

    console.log('🎉 All analytics endpoints working!');

  } catch (error) {
    console.error('❌ Error testing analytics:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔐 Need valid admin JWT token. Get it from the frontend after logging in as admin.');
    }
  }
}

// For manual testing, you can call this function
// testAnalyticsEndpoints();

module.exports = { testAnalyticsEndpoints };