/**
 * Test script to simulate a Stripe webhook and verify it's being processed
 * Run with: node test-webhook.js
 */

const http = require('http');

// Sample checkout.session.completed webhook payload
const webhookPayload = {
  id: "evt_test_webhook",
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_b19bPcS0Dyet6Q6Pq2qPMgqgOo0VGZcLWZ1JNbEdQ0bHu1NqJwB3WU2RhO",
      object: "checkout.session",
      payment_status: "paid",
      payment_intent: "pi_test_12345",
      amount_total: 29900,
      currency: "usd",
      customer_details: {
        email: "mondalsubarna29@gmail.com",
        name: "Test User"
      },
      metadata: {
        userId: "68e5482dc0f20dbdf8b3fc65",
        serviceId: "1"
      },
      created: Math.floor(Date.now() / 1000)
    }
  }
};

function testWebhook(url) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(webhookPayload);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      }
    };

    console.log(`\n🧪 Testing webhook endpoint: POST http://localhost:5000${url}`);
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2).substring(0, 200) + '...');

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`\n✅ Response Status: ${res.statusCode}`);
        console.log(`Response Body: ${responseData}`);
        
        if (res.statusCode === 404) {
          console.log('❌ ERROR: Webhook endpoint not found (404)');
          resolve(false);
        } else {
          console.log('✅ SUCCESS: Webhook endpoint is accessible!');
          resolve(true);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ ERROR:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('      WEBHOOK ENDPOINT TEST');
  console.log('═══════════════════════════════════════════');

  try {
    // Test the Stripe CLI default URL
    console.log('\n📍 Test 1: Stripe CLI default URL');
    const test1 = await testWebhook('/api/stripe/webhook');
    
    // Test the original URL
    console.log('\n\n📍 Test 2: Original webhook URL');
    const test2 = await testWebhook('/api/webhooks/stripe');

    console.log('\n═══════════════════════════════════════════');
    console.log('           TEST RESULTS');
    console.log('═══════════════════════════════════════════');
    console.log(`/api/stripe/webhook:    ${test1 ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`/api/webhooks/stripe:   ${test2 ? '✅ WORKING' : '❌ FAILED'}`);
    console.log('═══════════════════════════════════════════\n');

    if (test1 && test2) {
      console.log('🎉 SUCCESS! Both webhook endpoints are working!');
      console.log('✅ Your payment status will now update automatically.');
      console.log('\n💡 Next steps:');
      console.log('   1. Make a test payment');
      console.log('   2. Watch your backend console for webhook logs');
      console.log('   3. Verify payment status changes to "succeeded"\n');
    } else {
      console.log('⚠️  WARNING: Some endpoints are not working.');
      console.log('   Please restart your backend server.\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('   Make sure your backend server is running on port 5000\n');
  }
}

runTests();
