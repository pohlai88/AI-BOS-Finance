/**
 * Kernel Gateway Load Test (k6) - HARDENED
 * 
 * Tests Gateway throughput and latency under load.
 * 
 * Prerequisites:
 * - Install k6: https://k6.io/docs/getting-started/installation/
 * - Kernel running in PRODUCTION mode: pnpm build && pnpm start
 * 
 * Usage:
 *   # Production mode (strict thresholds)
 *   k6 run apps/kernel/__tests__/load/gateway.k6.js
 * 
 *   # Dev mode (relaxed thresholds)
 *   MODE=dev k6 run apps/kernel/__tests__/load/gateway.k6.js
 * 
 *   # Custom VUs/duration
 *   k6 run --vus 50 --duration 30s apps/kernel/__tests__/load/gateway.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

// Detect mode: production (default) or dev
const MODE = __ENV.MODE || 'production';
const IS_DEV = MODE === 'dev';

// ✅ FIX: Different thresholds for dev vs production
const THRESHOLDS = IS_DEV
  ? {
    // Dev mode thresholds (relaxed for pnpm dev)
    'http_req_duration{name:health}': ['p(95)<500'],
    'http_req_duration{name:registry}': ['p(95)<1000'],
    'http_req_duration{name:audit}': ['p(95)<1000'],
    http_req_failed: ['rate<0.05'], // 5% error rate acceptable in dev
  }
  : {
    // Production mode thresholds (strict)
    'http_req_duration{name:health}': ['p(95)<100', 'p(99)<200'],
    'http_req_duration{name:registry}': ['p(95)<200', 'p(99)<500'],
    'http_req_duration{name:audit}': ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'], // 1% error rate max
  };

// Test Configuration
export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp up to 20 virtual users
    { duration: '30s', target: 20 }, // Maintain 20 users for 30s
    { duration: '10s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: THRESHOLDS,
};

const BASE_URL = __ENV.KERNEL_URL || 'http://localhost:3001';
const TENANT_ID = 'load-test-tenant';

/**
 * Main test scenario
 * Runs for each virtual user in parallel
 */
export default function () {
  const headers = {
    'x-tenant-id': TENANT_ID,
    'Content-Type': 'application/json',
  };

  // 1. Health Check (Lightweight)
  const healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health' },
  });

  check(healthRes, {
    'health status is 200 or 503': (r) => r.status === 200 || r.status === 503,
    'health has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return ['healthy', 'degraded', 'unhealthy'].includes(body.status);
      } catch {
        return false;
      }
    },
  });

  // 2. Registry List (Read Heavy)
  const listRes = http.get(`${BASE_URL}/api/kernel/registry/canons`, {
    headers,
    tags: { name: 'registry' },
  });

  check(listRes, {
    'registry list is 200': (r) => r.status === 200,
    'registry has items array': (r) => {
      try {
        return JSON.parse(r.body).items !== undefined;
      } catch {
        return false;
      }
    },
  });

  // 3. Audit Query (Filtering + Pagination)
  const auditRes = http.get(
    `${BASE_URL}/api/kernel/audit/events?limit=10`,
    {
      headers,
      tags: { name: 'audit' },
    }
  );

  check(auditRes, {
    'audit query is 200': (r) => r.status === 200,
    'audit has events': (r) => {
      try {
        return JSON.parse(r.body).data?.events !== undefined;
      } catch {
        return false;
      }
    },
  });

  // Think time between iterations
  sleep(1);
}

/**
 * Setup: Runs once before test
 */
export function setup() {
  console.log(`\n🚀 Kernel Load Test`);
  console.log(`   Mode: ${MODE.toUpperCase()}`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Tenant: ${TENANT_ID}`);
  console.log(`   Thresholds: ${IS_DEV ? 'Relaxed (Dev)' : 'Strict (Production)'}\n`);

  // Verify Kernel is healthy before starting
  const health = http.get(`${BASE_URL}/api/health`);
  if (health.status !== 200 && health.status !== 503) {
    throw new Error(`Kernel is not healthy (status: ${health.status})`);
  }

  console.log('   ✅ Kernel is reachable - starting load test...\n');
}

/**
 * Teardown: Runs once after test
 */
export function teardown(data) {
  console.log('\n✅ Load test complete!\n');
}
