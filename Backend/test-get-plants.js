/**
 * Test GET Plants Endpoint
 * This will help us see the actual error from the backend
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testGetPlants() {
  try {
    console.log('Testing GET /api/plants endpoint...\n');

    // First, try without auth to see the error
    console.log('1. Testing without authentication:');
    try {
      const response = await axios.get(`${API_URL}/plants`);
      console.log('✅ Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Status:', error.response.status);
        console.log('❌ Error:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Error:', error.message);
      }
    }

    console.log('\n2. Testing with fake token (to see auth error):');
    try {
      const response = await axios.get(`${API_URL}/plants`, {
        headers: {
          'Authorization': 'Bearer fake-token-12345'
        }
      });
      console.log('✅ Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Status:', error.response.status);
        console.log('❌ Error:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Error:', error.message);
      }
    }

    console.log('\n3. Get a real token by checking localStorage in the browser:');
    console.log('   - Open browser DevTools (F12)');
    console.log('   - Go to Application > Local Storage > http://localhost:8080');
    console.log('   - Copy the value of "agrotrack_token"');
    console.log('   - Run: node test-get-plants.js YOUR_TOKEN_HERE');

    // If token provided via command line
    const token = process.argv[2];
    if (token) {
      console.log('\n4. Testing with provided token:');
      try {
        const response = await axios.get(`${API_URL}/plants?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Success! Response:', JSON.stringify(response.data, null, 2));
      } catch (error) {
        if (error.response) {
          console.log('❌ Status:', error.response.status);
          console.log('❌ Error:', JSON.stringify(error.response.data, null, 2));
        } else {
          console.log('❌ Error:', error.message);
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testGetPlants();
