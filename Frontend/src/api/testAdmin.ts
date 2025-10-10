// Quick test script to debug admin API
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export async function testAdminDashboard() {
  const token = localStorage.getItem('token');
  
  console.log('🔍 Testing Admin API');
  console.log('Token exists:', !!token);
  console.log('Token value:', token?.substring(0, 20) + '...');
  
  try {
    const response = await axios.get(`${API_URL}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

// Run this in browser console: 
// import { testAdminDashboard } from './api/testAdmin'
// testAdminDashboard()
