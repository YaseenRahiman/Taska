// Test authentication flow
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testAuthFlow() {
  console.log('=== TASKA AUTH FLOW TEST ===\n');

  try {
    // Test 1: Register
    console.log('1. Testing Registration...');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: 'Test123456!',
      role: 'CLIENT',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+27123456789'
    };

    const registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
    console.log('✅ Registration successful');
    console.log('   - User ID:', registerResponse.data.user.id);
    console.log('   - Email:', registerResponse.data.user.email);
    console.log('   - Role:', registerResponse.data.user.role);
    console.log('   - Access Token:', registerResponse.data.accessToken.substring(0, 20) + '...');
    console.log('   - Refresh Token:', registerResponse.data.refreshToken.substring(0, 20) + '...');

    // Test 2: Login
    console.log('\n2. Testing Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    console.log('✅ Login successful');
    console.log('   - Access Token:', loginResponse.data.accessToken.substring(0, 20) + '...');
    console.log('   - User ID:', loginResponse.data.user.id);

    // Test 3: Get Profile
    console.log('\n3. Testing Get Profile...');
    const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${loginResponse.data.accessToken}`
      }
    });
    console.log('✅ Profile retrieved successfully');
    console.log('   - Name:', profileResponse.data.profile.firstName, profileResponse.data.profile.lastName);
    console.log('   - Phone:', profileResponse.data.profile.phoneNumber);

    // Test 4: Token Structure
    console.log('\n4. Validating Token Structure...');
    const hasAccessToken = !!registerResponse.data.accessToken;
    const hasRefreshToken = !!registerResponse.data.refreshToken;
    const hasExpiresIn = !!registerResponse.data.expiresIn;
    const hasUser = !!registerResponse.data.user;

    console.log('   - accessToken present:', hasAccessToken ? '✅' : '❌');
    console.log('   - refreshToken present:', hasRefreshToken ? '✅' : '❌');
    console.log('   - expiresIn present:', hasExpiresIn ? '✅' : '❌');
    console.log('   - user object present:', hasUser ? '✅' : '❌');

    if (hasAccessToken && hasRefreshToken && hasExpiresIn && hasUser) {
      console.log('\n✅ ALL TESTS PASSED! Backend authentication is working correctly.');
    } else {
      console.log('\n❌ Some token fields are missing!');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAuthFlow();
