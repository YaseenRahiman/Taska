import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const TEST_USERS = [
  {
    email: 'client@test.com',
    password: 'Test123!@#',
    role: 'CLIENT',
    firstName: 'Test',
    lastName: 'Client',
    phoneNumber: '+27821234567'
  },
  {
    email: 'artisan@test.com',
    password: 'Test123!@#',
    role: 'ARTISAN',
    firstName: 'Test',
    lastName: 'Artisan',
    phoneNumber: '+27829876543',
    trade: 'plumbing',
    experience: 5,
    location: 'Johannesburg',
    bio: 'Experienced plumber with 5 years in the industry'
  },
  {
    email: 'admin@test.com',
    password: 'Test123!@#',
    role: 'ADMIN',
    firstName: 'Test',
    lastName: 'Admin',
    phoneNumber: '+27831112222'
  }
];

async function createTestUser(userData: any): Promise<void> {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    console.log(`✓ Created test user: ${userData.email} (${userData.role})`);
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log(`  User already exists: ${userData.email}`);
    } else {
      console.error(`✗ Failed to create ${userData.email}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

async function main() {
  console.log('Creating test users...\n');

  for (const user of TEST_USERS) {
    await createTestUser(user);
  }

  console.log('\n✓ Test user setup complete');
}

main().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
