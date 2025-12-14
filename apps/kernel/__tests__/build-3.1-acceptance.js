/**
 * Build 3.1 Phase 1 - IAM Acceptance Tests
 * 
 * Tests the full IAM flow:
 * 1. Create user
 * 2. Attempt duplicate user (expect 409)
 * 3. Create role
 * 4. Assign role to user
 * 5. Verify audit trail
 * 6. Tenant isolation check
 */

const BASE_URL = process.env.KERNEL_URL || 'http://localhost:3001';
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const CID = `iam-smoke-${Date.now()}`;

console.log('='.repeat(60));
console.log('Build 3.1 Phase 1 - IAM Acceptance Tests');
console.log('='.repeat(60));
console.log(`BASE_URL: ${BASE_URL}`);
console.log(`TENANT_ID: ${TENANT_ID}`);
console.log(`CORRELATION_ID: ${CID}`);
console.log('='.repeat(60));
console.log('');

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    console.log(`\n📝 ${name}`);
    await fn();
    console.log(`✅ PASSED`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
}

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'x-tenant-id': TENANT_ID,
    'x-correlation-id': CID,
    'content-type': 'application/json',
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  return { status: res.status, data };
}

async function requestTenantB(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'x-tenant-id': TENANT_B,
    'x-correlation-id': CID,
    'content-type': 'application/json',
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  return { status: res.status, data };
}

let userId, roleId;

async function runTests() {
  // Test 1: Create user (expect 201)
  await test('Test 1: Create user (expect 201)', async () => {
    const { status, data } = await request('POST', '/api/kernel/iam/users', {
      email: 'alice@example.com',
      name: 'Alice',
    });

    console.log(`   Status: ${status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (status !== 201) {
      throw new Error(`Expected 201, got ${status}`);
    }

    if (!data.ok) {
      throw new Error(`Expected ok=true`);
    }

    if (!data.data.user_id) {
      throw new Error(`Missing user_id`);
    }

    userId = data.data.user_id;
    console.log(`   ✓ User created: ${userId}`);
  });

  // Test 2: Duplicate user (expect 409)
  await test('Test 2: Duplicate user (expect 409 EMAIL_EXISTS)', async () => {
    const { status, data } = await request('POST', '/api/kernel/iam/users', {
      email: 'alice@example.com',
      name: 'Alice',
    });

    console.log(`   Status: ${status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (status !== 409) {
      throw new Error(`Expected 409, got ${status}`);
    }

    if (data.error.code !== 'EMAIL_EXISTS') {
      throw new Error(`Expected EMAIL_EXISTS, got ${data.error.code}`);
    }

    console.log(`   ✓ Duplicate rejected correctly`);
  });

  // Test 3: Create role (expect 201)
  await test('Test 3: Create role (expect 201)', async () => {
    const { status, data } = await request('POST', '/api/kernel/iam/roles', {
      name: 'Finance Manager',
    });

    console.log(`   Status: ${status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (status !== 201) {
      throw new Error(`Expected 201, got ${status}`);
    }

    if (!data.ok) {
      throw new Error(`Expected ok=true`);
    }

    if (!data.data.role_id) {
      throw new Error(`Missing role_id`);
    }

    roleId = data.data.role_id;
    console.log(`   ✓ Role created: ${roleId}`);
  });

  // Test 4: Assign role (expect 200)
  await test('Test 4: Assign role to user (expect 200)', async () => {
    const { status, data } = await request(
      'POST',
      `/api/kernel/iam/roles/${roleId}/assign`,
      { user_id: userId }
    );

    console.log(`   Status: ${status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}`);
    }

    if (!data.ok) {
      throw new Error(`Expected ok=true`);
    }

    console.log(`   ✓ Role assigned successfully`);
  });

  // Test 5: Audit trail (expect USER_CREATE, ROLE_CREATE, ROLE_ASSIGN)
  await test('Test 5: Verify audit trail (correlation ID tracing)', async () => {
    const { status, data } = await request(
      'GET',
      `/api/kernel/audit/events?correlation_id=${CID}&limit=50&offset=0`
    );

    console.log(`   Status: ${status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}`);
    }

    const events = data.data.events;
    if (!Array.isArray(events)) {
      throw new Error(`Expected events array`);
    }

    const actions = events.map((e) => e.action);
    console.log(`   Actions found:`, actions);

    const requiredActions = [
      'kernel.iam.user.create',
      'kernel.iam.role.create',
      'kernel.iam.role.assign',
    ];

    for (const action of requiredActions) {
      if (!actions.includes(action)) {
        throw new Error(`Missing audit action: ${action}`);
      }
    }

    console.log(`   ✓ All audit events present`);
  });

  // Test 6: Tenant isolation (expect empty)
  await test('Test 6: Tenant isolation check (expect empty)', async () => {
    const { status, data } = await requestTenantB(
      'GET',
      '/api/kernel/iam/users?limit=50&offset=0'
    );

    console.log(`   Status: ${status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}`);
    }

    if (data.data.items.length !== 0) {
      throw new Error(`Expected 0 users for Tenant B, got ${data.data.items.length}`);
    }

    console.log(`   ✓ Tenant isolation verified`);
  });

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📊 Total:  ${testsPassed + testsFailed}`);
  console.log('='.repeat(60));

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
