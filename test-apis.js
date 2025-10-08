#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for AgroTrack
 * Tests all backend endpoints to ensure 100% connectivity
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function log(message, status = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    info: '\x1b[36m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[status]}[${timestamp}] ${message}${colors.reset}`);
}

function recordResult(testName, success, error = null) {
  results.total++;
  if (success) {
    results.passed++;
    log(`✅ ${testName}`, 'success');
  } else {
    results.failed++;
    log(`❌ ${testName}: ${error}`, 'error');
  }
  results.details.push({ test: testName, success, error });
}

async function testHealth() {
  try {
    const response = await axios.get('http://localhost:5000/health');
    recordResult('Health Check', response.status === 200);
    return response.data;
  } catch (error) {
    recordResult('Health Check', false, error.message);
    return null;
  }
}

async function testAuth() {
  log('🔐 Testing Authentication Endpoints...');

  // Test login with mock user
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'sanukanm@gmail.com',
      password: '200308'
    });
    recordResult('Auth Login', loginResponse.status === 200);
    if (loginResponse.data?.data?.tokens?.accessToken) {
      authToken = loginResponse.data.data.tokens.accessToken;
      log(`🔑 Got auth token: ${authToken.substring(0, 20)}...`);
    }
  } catch (error) {
    recordResult('Auth Login', false, error.response?.data?.message || error.message);
  }

  // Test register
  try {
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass123'
    });
    recordResult('Auth Register', registerResponse.status === 201);
  } catch (error) {
    recordResult('Auth Register', false, error.response?.data?.message || error.message);
  }
}

async function testPlants() {
  if (!authToken) {
    recordResult('Plants API', false, 'No auth token available');
    return;
  }

  log('🌱 Testing Plants API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Get plants
  try {
    const response = await axios.get(`${BASE_URL}/plants`, config);
    recordResult('Get Plants', response.status === 200);
  } catch (error) {
    recordResult('Get Plants', false, error.response?.data?.message || error.message);
  }

  // Create plant
  try {
    const response = await axios.post(`${BASE_URL}/plants`, {
      name: 'Test Plant',
      species: 'Test Species',
      category: 'Test Category'
    }, config);
    recordResult('Create Plant', response.status === 201);
  } catch (error) {
    recordResult('Create Plant', false, error.response?.data?.message || error.message);
  }
}

async function testCareLogs() {
  if (!authToken) {
    recordResult('Care Logs API', false, 'No auth token available');
    return;
  }

  log('📝 Testing Care Logs API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Get care logs
  try {
    const response = await axios.get(`${BASE_URL}/care-logs`, config);
    recordResult('Get Care Logs', response.status === 200);
  } catch (error) {
    recordResult('Get Care Logs', false, error.response?.data?.message || error.message);
  }
}

async function testUsers() {
  if (!authToken) {
    recordResult('Users API', false, 'No auth token available');
    return;
  }

  log('👤 Testing Users API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Get profile
  try {
    const response = await axios.get(`${BASE_URL}/users/profile`, config);
    recordResult('Get User Profile', response.status === 200);
  } catch (error) {
    recordResult('Get User Profile', false, error.response?.data?.message || error.message);
  }
}

async function testAI() {
  if (!authToken) {
    recordResult('AI Chat API', false, 'No auth token available');
    return;
  }

  log('🤖 Testing AI Chat API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Test AI chat
  try {
    const response = await axios.post(`${BASE_URL}/ai/chat`, {
      message: 'Hello, can you help me with plant care?'
    }, config);
    recordResult('AI Chat', response.status === 200);
  } catch (error) {
    recordResult('AI Chat', false, error.response?.data?.message || error.message);
  }
}

async function testAnalytics() {
  if (!authToken) {
    recordResult('Analytics API', false, 'No auth token available');
    return;
  }

  log('📊 Testing Analytics API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Get dashboard analytics
  try {
    const response = await axios.get(`${BASE_URL}/analytics/dashboard`, config);
    recordResult('Dashboard Analytics', response.status === 200);
  } catch (error) {
    recordResult('Dashboard Analytics', false, error.response?.data?.message || error.message);
  }
}

async function testWeather() {
  log('🌤️ Testing Weather API...');

  // Test weather endpoint (might not require auth)
  try {
    const response = await axios.get(`${BASE_URL}/weather?lat=40.7128&lon=-74.0060`);
    recordResult('Weather API', response.status === 200);
  } catch (error) {
    recordResult('Weather API', false, error.response?.data?.message || error.message);
  }
}

async function testDiseaseDetection() {
  if (!authToken) {
    recordResult('Disease Detection API', false, 'No auth token available');
    return;
  }

  log('🔬 Testing Disease Detection API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Test disease detection (may require image upload)
  try {
    const response = await axios.post(`${BASE_URL}/disease-detection/analyze`, {}, config);
    recordResult('Disease Detection', response.status === 200);
  } catch (error) {
    // This might fail if no image is provided, which is expected
    if (error.response?.status === 400) {
      recordResult('Disease Detection', true, 'Expected validation error for missing image');
    } else {
      recordResult('Disease Detection', false, error.response?.data?.message || error.message);
    }
  }
}

async function testReminders() {
  if (!authToken) {
    recordResult('Reminders API', false, 'No auth token available');
    return;
  }

  log('⏰ Testing Reminders API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Get reminders
  try {
    const response = await axios.get(`${BASE_URL}/reminders`, config);
    recordResult('Get Reminders', response.status === 200);
  } catch (error) {
    recordResult('Get Reminders', false, error.response?.data?.message || error.message);
  }
}

async function testCommunity() {
  if (!authToken) {
    recordResult('Community API', false, 'No auth token available');
    return;
  }

  log('🌐 Testing Community API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Get posts
  try {
    const response = await axios.get(`${BASE_URL}/community/posts`, config);
    recordResult('Get Community Posts', response.status === 200);
  } catch (error) {
    recordResult('Get Community Posts', false, error.response?.data?.message || error.message);
  }
}

async function testAdmin() {
  if (!authToken) {
    recordResult('Admin API', false, 'No auth token available');
    return;
  }

  log('👑 Testing Admin API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Get admin stats (might require admin role)
  try {
    const response = await axios.get(`${BASE_URL}/admin/stats`, config);
    recordResult('Admin Stats', response.status === 200);
  } catch (error) {
    if (error.response?.status === 403) {
      recordResult('Admin Stats', true, 'Expected forbidden for non-admin user');
    } else {
      recordResult('Admin Stats', false, error.response?.data?.message || error.message);
    }
  }
}

async function testBugReports() {
  if (!authToken) {
    recordResult('Bug Reports API', false, 'No auth token available');
    return;
  }

  log('🐛 Testing Bug Reports API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Create bug report
  try {
    const response = await axios.post(`${BASE_URL}/bug-reports`, {
      title: 'Test Bug Report',
      description: 'This is a test bug report',
      severity: 'low'
    }, config);
    recordResult('Create Bug Report', response.status === 201);
  } catch (error) {
    recordResult('Create Bug Report', false, error.response?.data?.message || error.message);
  }
}

async function testContact() {
  log('📧 Testing Contact API...');

  // Test contact form (might not require auth)
  try {
    const response = await axios.post(`${BASE_URL}/contact`, {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'Test message'
    });
    recordResult('Contact Form', response.status === 201);
  } catch (error) {
    recordResult('Contact Form', false, error.response?.data?.message || error.message);
  }
}

async function testSearch() {
  if (!authToken) {
    recordResult('Search API', false, 'No auth token available');
    return;
  }

  log('🔍 Testing Search API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Search plants
  try {
    const response = await axios.get(`${BASE_URL}/search/plants?q=test`, config);
    recordResult('Search Plants', response.status === 200);
  } catch (error) {
    recordResult('Search Plants', false, error.response?.data?.message || error.message);
  }
}

async function testExportImport() {
  if (!authToken) {
    recordResult('Export/Import API', false, 'No auth token available');
    return;
  }

  log('📤 Testing Export/Import API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Export data
  try {
    const response = await axios.get(`${BASE_URL}/export/plants`, config);
    recordResult('Export Plants', response.status === 200);
  } catch (error) {
    recordResult('Export Plants', false, error.response?.data?.message || error.message);
  }
}

async function testNotifications() {
  if (!authToken) {
    recordResult('Notifications API', false, 'No auth token available');
    return;
  }

  log('🔔 Testing Notifications API...');

  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  // Get notifications
  try {
    const response = await axios.get(`${BASE_URL}/notifications`, config);
    recordResult('Get Notifications', response.status === 200);
  } catch (error) {
    recordResult('Get Notifications', false, error.response?.data?.message || error.message);
  }
}

async function runAllTests() {
  log('🚀 Starting Comprehensive AgroTrack API Testing...');
  log('=' .repeat(60));

  // Test health first
  const healthData = await testHealth();
  if (!healthData) {
    log('❌ Backend server is not responding. Cannot continue testing.', 'error');
    return;
  }

  // Run all API tests
  await testAuth();
  await testPlants();
  await testCareLogs();
  await testUsers();
  await testAI();
  await testAnalytics();
  await testWeather();
  await testDiseaseDetection();
  await testReminders();
  await testCommunity();
  await testAdmin();
  await testBugReports();
  await testContact();
  await testSearch();
  await testExportImport();
  await testNotifications();

  // Print summary
  log('=' .repeat(60));
  log('📊 TEST RESULTS SUMMARY', 'info');
  log('=' .repeat(60));
  log(`Total Tests: ${results.total}`, 'info');
  log(`Passed: ${results.passed}`, 'success');
  log(`Failed: ${results.failed}`, 'error');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, results.failed === 0 ? 'success' : 'error');

  if (results.failed > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    results.details.filter(r => !r.success).forEach(result => {
      log(`  - ${result.test}: ${result.error}`, 'error');
    });
  }

  log('\n✅ PASSED TESTS:', 'success');
  results.details.filter(r => r.success).forEach(result => {
    log(`  - ${result.test}`, 'success');
  });

  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! AgroTrack is 100% connected and working!', 'success');
  } else {
    log(`\n⚠️ ${results.failed} tests failed. Please check the backend implementation.`, 'warning');
  }
}

// Handle script execution
if (require.main === module) {
  runAllTests().catch(error => {
    log(`💥 Script execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runAllTests };