/**
 * Test Plant Creation Endpoint
 * Run with: node test-plant-create.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid token from your login
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';

async function testPlantCreation() {
  try {
    console.log('Testing plant creation endpoint...\n');

    const plantData = {
      name: 'Test Rose',
      scientificName: 'Rosa rubiginosa',
      species: 'Rosa',
      description: 'A beautiful red rose',
      category: 'Flowering Plant',
      wateringFrequency: 3,
      sunlightHours: 6,
      soilType: 'Well-draining soil',
      careInstructions: 'Water regularly, provide full sun'
    };

    const response = await axios.post(`${API_URL}/plants`, plantData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Plant created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\nPlant ID:', response.data.data?.plant?._id);
  } catch (error) {
    console.error('❌ Error creating plant:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Check if token is provided via command line argument
const token = process.argv[2];
if (token) {
  AUTH_TOKEN = token;
}

if (AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
  console.log('⚠️  Please provide an auth token:');
  console.log('   node test-plant-create.js YOUR_TOKEN_HERE');
  console.log('\nOr get a token by logging in through the frontend and checking localStorage.agrotrack_token');
  process.exit(1);
}

testPlantCreation();
