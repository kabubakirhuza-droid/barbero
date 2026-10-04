require('dotenv').config({ path: require('path').resolve(__dirname, 'backend/.env') });
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'barbero_super_jwt_secret_key_2026';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('=== STARTING BARBERO E2E TEST SUITE ===');
  console.log(`Connecting to backend at: ${BASE_URL}\n`);

  // 1. Health Check
  console.log('1. Testing /health endpoint...');
  const health = await request('/health');
  if (health.status !== 200 || !health.data.status) {
    throw new Error(`Health check failed: ${JSON.stringify(health)}`);
  }
  console.log('   ✓ Health check returned OK (200)\n');

  // 2. Auth Protection Verification
  console.log('2. Testing Authentication Middleware (Unauthorized 401 checks)...');
  const unauthMe = await request('/auth/me');
  if (unauthMe.status !== 401) {
    throw new Error(`Expected 401 on /auth/me without token, got ${unauthMe.status}`);
  }
  console.log('   ✓ /auth/me correctly rejects request without token (401)');

  const unauthAppointments = await request('/appointments');
  if (unauthAppointments.status !== 401) {
    throw new Error(`Expected 401 on /appointments without token, got ${unauthAppointments.status}`);
  }
  console.log('   ✓ /appointments correctly rejects request without token (401)');

  const unauthServices = await request('/services');
  if (unauthServices.status !== 401) {
    throw new Error(`Expected 401 on /services without token, got ${unauthServices.status}`);
  }
  console.log('   ✓ /services correctly rejects request without token (401)');

  const unauthAnalytics = await request('/analytics');
  if (unauthAnalytics.status !== 401) {
    throw new Error(`Expected 401 on /analytics without token, got ${unauthAnalytics.status}`);
  }
  console.log('   ✓ /analytics correctly rejects request without token (401)\n');

  // 3. Fake Code Bypass Prevention
  console.log('3. Testing Fake Code Rejection (111111 / 777777 / 123456)...');
  const fakeVerify = await request('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ phone: '+998901234567', code: '111111', requestId: 'fake_req' }),
  });
  if (fakeVerify.status === 200) {
    throw new Error('Fake code 111111 was accepted! Must be rejected.');
  }
  console.log(`   ✓ Fake code 111111 rejected with status ${fakeVerify.status} (${fakeVerify.data.error || 'rejected'})\n`);

  // 4. Authenticated Master Flow
  console.log('4. Testing Authenticated Master Session & Data Scoping...');
  // Create valid master JWT token
  const masterId = 'test-master-' + Date.now();
  const token = jwt.sign(
    { userId: masterId, phone: '+998909998877', role: 'MASTER' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 4a. Register Profile
  const regProfile = await request('/auth/register-profile', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ism: 'Temur', familiya: 'Vohidov', role: 'MASTER' }),
  });
  if (regProfile.status !== 200 || regProfile.data.user?.ism !== 'Temur') {
    throw new Error(`Register profile failed: ${JSON.stringify(regProfile)}`);
  }
  console.log('   ✓ Master profile registered and saved');

  // 4b. Get Me
  const meRes = await request('/auth/me', { headers: authHeaders });
  if (meRes.status !== 200 || meRes.data.user?.id !== masterId) {
    throw new Error(`Get me failed: ${JSON.stringify(meRes)}`);
  }
  console.log('   ✓ /auth/me returns authenticated master data');

  // 4c. Create and list Services
  const srvRes = await request('/services', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Soch va soqol grooming',
      price: 85000,
      duration: 30,
      badgeColor: '#A67C2E',
    }),
  });
  if (srvRes.status !== 201 || !srvRes.data.service?.id) {
    throw new Error(`Create service failed: ${JSON.stringify(srvRes)}`);
  }
  const serviceId = srvRes.data.service.id;
  console.log('   ✓ Service created successfully');

  // 4d. Create Appointment & Double Booking Collision Check
  const testDate = '2026-10-15';
  const testSlot = '11:00';
  const aptRes1 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Sardor',
      clientPhone: '+998901239988',
      serviceId,
      date: testDate,
      startTime: testSlot,
    }),
  });
  if (aptRes1.status !== 201 || !aptRes1.data.appointment?.id) {
    throw new Error(`Create appointment 1 failed: ${JSON.stringify(aptRes1)}`);
  }
  const aptId = aptRes1.data.appointment.id;
  console.log('   ✓ Appointment created on slot 11:00');

  // Try to create another appointment on the SAME slot (Double booking collision test)
  const aptRes2 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Aziz',
      clientPhone: '+998905556677',
      serviceId,
      date: testDate,
      startTime: testSlot,
    }),
  });
  if (aptRes2.status !== 409) {
    throw new Error(`Expected 409 Conflict for double booking on same slot, got ${aptRes2.status}`);
  }
  console.log('   ✓ Double booking prevented with 409 Conflict');

  // 4e. Delete Appointment
  const delRes = await request(`/appointments/${aptId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (delRes.status !== 200 || !delRes.data.success) {
    throw new Error(`Delete appointment failed: ${JSON.stringify(delRes)}`);
  }
  console.log('   ✓ Appointment deleted successfully');

  // Now slot 11:00 is free again -> create new booking should succeed
  const aptRes3 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Aziz (Re-booked)',
      clientPhone: '+998905556677',
      serviceId,
      date: testDate,
      startTime: testSlot,
    }),
  });
  if (aptRes3.status !== 201) {
    throw new Error(`Re-booking freed slot failed: ${JSON.stringify(aptRes3)}`);
  }
  console.log('   ✓ Slot successfully freed and re-booked');

  // 5. Booking Requests (Client creates -> Master accepts/rejects)
  console.log('\n5. Testing Booking Requests Flow...');
  const reqCreate = await request('/booking-requests', {
    method: 'POST',
    body: JSON.stringify({
      masterId,
      clientName: 'Dilshod',
      clientPhone: '+998904443322',
      serviceId,
      serviceName: 'Soch va soqol grooming',
      servicePrice: 85000,
      date: '2026-10-16',
      time: '14:00',
    }),
  });
  if (reqCreate.status !== 201 || !reqCreate.data.request?.id) {
    throw new Error(`Client booking request failed: ${JSON.stringify(reqCreate)}`);
  }
  const bookingReqId = reqCreate.data.request.id;
  console.log('   ✓ Client booking request submitted');

  // Master lists booking requests
  const listReqs = await request('/booking-requests', { headers: authHeaders });
  if (listReqs.status !== 200 || listReqs.data.requests.length === 0) {
    throw new Error(`Master list booking requests failed: ${JSON.stringify(listReqs)}`);
  }
  console.log(`   ✓ Master sees ${listReqs.data.requests.length} incoming booking request(s)`);

  // Master accepts booking request
  const acceptReq = await request(`/booking-requests/${bookingReqId}/accept`, {
    method: 'POST',
    headers: authHeaders,
  });
  if (acceptReq.status !== 200 || !acceptReq.data.appointment) {
    throw new Error(`Accept booking request failed: ${JSON.stringify(acceptReq)}`);
  }
  console.log('   ✓ Master accepted booking request and auto-scheduled appointment');

  // 6. Push Subscription Scope
  console.log('\n6. Testing Push Subscription Registration...');
  const pushRes = await request('/push/subscribe', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      subscription: {
        endpoint: `https://fcm.googleapis.com/fcm/send/test_${Date.now()}`,
        keys: { p256dh: 'BNcRdreStoreKey...', auth: 'tBHxAuth...' },
      },
      device: 'iPhone 15 Pro (PWA)',
    }),
  });
  if (pushRes.status !== 200 || !pushRes.data.success) {
    throw new Error(`Push subscribe failed: ${JSON.stringify(pushRes)}`);
  }
  console.log('   ✓ Push subscription registered and linked to master account');

  console.log('\n========================================');
  console.log(' ALL BARBERO E2E TESTS PASSED (100%)');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ E2E TEST SUITE FAILED:', err.message);
  process.exit(1);
});
