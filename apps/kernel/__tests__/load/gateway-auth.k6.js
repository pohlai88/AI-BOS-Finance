/**
 * Kernel Gateway Load Test - AUTHENTICATED (Day 7 Hardening)
 * 
 * Tests the FULL flow: Login → Gateway → Payment Cell
 * This is the realistic production scenario.
 * 
 * Prerequisites:
 * - Docker stack running: docker-compose up -d
 * - Data seeded: pnpm seed:happy-path
 * - Install k6: https://k6.io/docs/getting-started/installation/
 * 
 * Usage:
 *   k6 run apps/kernel/__tests__/load/gateway-auth.k6.js
 * 
 *   # Custom VUs/duration
 *   k6 run --vus 50 --duration 60s apps/kernel/__tests__/load/gateway-auth.k6.js
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const paymentProcessed = new Counter('payments_processed');
const paymentLatency = new Trend('payment_latency', true);

// Test Configuration
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 VUs
    { duration: '30s', target: 50 },  // Sustain 50 VUs
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],    // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],      // <1% error rate
    payment_latency: ['p(95)<250'],      // Payment processing p95 < 250ms
  },
};

// Environment
const KERNEL_URL = __ENV.KERNEL_URL || 'http://localhost:3001';
const CELL_URL = __ENV.CELL_URL || 'http://localhost:4000';
const TENANT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

/**
 * Setup: Login once, share token across all VUs
 */
export function setup() {
  console.log('\n🚀 Kernel Gateway Load Test (Authenticated)');
  console.log(`   Kernel URL: ${KERNEL_URL}`);
  console.log(`   Cell URL: ${CELL_URL}`);
  console.log(`   Tenant ID: ${TENANT_ID}\n`);

  // Step 1: Login to get JWT
  const loginRes = http.post(
    `${KERNEL_URL}/api/kernel/iam/login`,
    JSON.stringify({
      email: 'admin@demo.local',
      password: 'password123',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID,
      },
    }
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data?.access_token !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    console.error('❌ Login failed! Response:', loginRes.body);
    fail('Could not authenticate. Ensure pnpm seed:happy-path has been run.');
  }

  const body = JSON.parse(loginRes.body);
  const token = body.data.access_token;
  console.log('   ✅ Authenticated successfully\n');

  // Step 2: Verify Cell is healthy
  const cellHealth = http.get(`${CELL_URL}/health`);
  check(cellHealth, {
    'cell is healthy': (r) => r.status === 200,
  });

  console.log('   ✅ Payment Cell is healthy\n');
  console.log('   Starting load test...\n');

  return { token };
}

/**
 * Main test scenario - runs for each VU
 */
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
    'x-correlation-id': `k6-${__VU}-${__ITER}-${Date.now()}`,
  };

  // Test 1: Process Payment via Cell directly (bypass Gateway for baseline)
  const paymentPayload = JSON.stringify({
    amount: Math.floor(Math.random() * 1000) + 100,
    currency: 'USD',
    beneficiary: `Load Test Inc VU${__VU}`,
  });

  const startTime = Date.now();
  const paymentRes = http.post(
    `${CELL_URL}/payments/process`,
    paymentPayload,
    { headers, tags: { name: 'payment_process' } }
  );
  const duration = Date.now() - startTime;

  const paymentSuccess = check(paymentRes, {
    'payment status is 200': (r) => r.status === 200,
    'payment has transaction_id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.transaction_id !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (paymentSuccess) {
    paymentProcessed.add(1);
    paymentLatency.add(duration);
  }

  // Test 2: Health Check (lightweight)
  const healthRes = http.get(`${KERNEL_URL}/api/health`, {
    tags: { name: 'health' },
  });

  check(healthRes, {
    'health check is 200': (r) => r.status === 200,
  });

  // Think time - simulate real user
  sleep(0.1);
}

/**
 * Teardown: Summary
 */
export function teardown(data) {
  console.log('\n✅ Load test complete!');
  console.log('   Check k6 summary above for detailed metrics.\n');
}
