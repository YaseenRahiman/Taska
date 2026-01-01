import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authRequests = new Counter('auth_requests');
const jobRequests = new Counter('job_requests');
const bidRequests = new Counter('bid_requests');
const messageRequests = new Counter('message_requests');
const responseTimes = new Trend('response_times');

export let options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm up
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 200 },  // Spike to 200 users
    { duration: '10m', target: 200 }, // Stay at 200 users
    { duration: '5m', target: 500 },  // Spike to 500 users
    { duration: '5m', target: 500 },  // Stay at 500 users
    { duration: '5m', target: 1000 }, // Peak load test
    { duration: '2m', target: 1000 }, // Stay at peak
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    http_req_failed: ['rate<0.05'],                   // Error rate under 5%
    errors: ['rate<0.1'],                             // Custom error rate under 10%
    auth_requests: ['count>1000'],                    // At least 1000 auth requests
    job_requests: ['count>5000'],                     // At least 5000 job requests
    bid_requests: ['count>2000'],                     // At least 2000 bid requests
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

// Test data
const users = [
  { email: 'test1@example.com', password: 'TestPassword123!' },
  { email: 'test2@example.com', password: 'TestPassword123!' },
  { email: 'test3@example.com', password: 'TestPassword123!' },
  { email: 'test4@example.com', password: 'TestPassword123!' },
  { email: 'test5@example.com', password: 'TestPassword123!' },
];

export function setup() {
  // Setup code to prepare test data
  console.log('Setting up load test...');
}

export default function () {
  // Simulate different user behaviors
  const scenarios = ['auth_flow', 'job_browsing', 'job_creation', 'bidding'];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  switch (scenario) {
    case 'auth_flow':
      testAuthFlow();
      break;
    case 'job_browsing':
      testJobBrowsing();
      break;
    case 'job_creation':
      testJobCreation();
      break;
    case 'bidding':
      testBidding();
      break;
  }

  sleep(1);
}

function testAuthFlow() {
  // Test user registration
  const registerPayload = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Load Test User',
  };

  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify(registerPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  const registerSuccess = check(registerRes, {
    'registration status is 201': (r) => r.status === 201,
  });

  errorRate.add(!registerSuccess);

  // Test user login
  const user = users[Math.floor(Math.random() * users.length)];
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('access_token') !== undefined,
  });

  errorRate.add(!loginSuccess);
}

function testJobBrowsing() {
  // Login first
  const user = users[Math.floor(Math.random() * users.length)];
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    errorRate.add(true);
    return;
  }

  const token = loginRes.json('access_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Browse jobs
  const jobsRes = http.get(`${BASE_URL}/jobs`, { headers });
  const jobsSuccess = check(jobsRes, {
    'jobs list status is 200': (r) => r.status === 200,
  });

  errorRate.add(!jobsSuccess);

  // Get job details if jobs exist
  const jobs = jobsRes.json('data');
  if (jobs && jobs.length > 0) {
    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
    const jobDetailRes = http.get(`${BASE_URL}/jobs/${randomJob.id}`, { headers });
    
    const jobDetailSuccess = check(jobDetailRes, {
      'job detail status is 200': (r) => r.status === 200,
    });

    errorRate.add(!jobDetailSuccess);
  }
}

function testJobCreation() {
  // Login first
  const user = users[Math.floor(Math.random() * users.length)];
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    errorRate.add(true);
    return;
  }

  const token = loginRes.json('access_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Create a job
  const jobPayload = {
    title: `Load Test Job ${Date.now()}`,
    description: 'This is a test job created during load testing',
    category: 'OTHER',
    budget: Math.floor(Math.random() * 1000) + 100,
    location: {
      address: 'Test Address',
      city: 'Test City',
      latitude: -26.2041,
      longitude: 28.0473,
    },
  };

  const createJobRes = http.post(`${BASE_URL}/jobs`, JSON.stringify(jobPayload), { headers });
  const createJobSuccess = check(createJobRes, {
    'job creation status is 201': (r) => r.status === 201,
  });

  errorRate.add(!createJobSuccess);
}

function testBidding() {
  // Login first
  const user = users[Math.floor(Math.random() * users.length)];
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    errorRate.add(true);
    return;
  }

  const token = loginRes.json('access_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Get available jobs
  const jobsRes = http.get(`${BASE_URL}/jobs`, { headers });
  if (jobsRes.status !== 200) {
    errorRate.add(true);
    return;
  }

  const jobs = jobsRes.json('data');
  if (jobs && jobs.length > 0) {
    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
    
    // Create a bid
    const bidPayload = {
      jobId: randomJob.id,
      amount: Math.floor(Math.random() * 500) + 50,
      message: 'Test bid message from load test',
    };

    const createBidRes = http.post(`${BASE_URL}/bids`, JSON.stringify(bidPayload), { headers });
    const createBidSuccess = check(createBidRes, {
      'bid creation status is 201': (r) => r.status === 201,
    });

    errorRate.add(!createBidSuccess);
  }
}

export function teardown(data) {
  console.log('Load test completed');
}
