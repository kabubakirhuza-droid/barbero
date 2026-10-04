require('dotenv').config({ path: require('path').resolve(__dirname, 'backend/.env') });
let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (e) {
  jwt = require('./backend/node_modules/jsonwebtoken');
}

let Pool;
try {
  Pool = require('pg').Pool;
} catch (e) {
  try {
    Pool = require('./backend/node_modules/pg').Pool;
  } catch (_) {}
}

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production_key';
const DATABASE_URL = process.env.DATABASE_URL || '';

const pool = Pool && DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;

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
  console.log('=== STARTING BARBERO E2E TEST SUITE (PostgreSQL Engine) ===');
  console.log(`Connecting to backend at: ${BASE_URL}\n`);

  // Ensure DB connection
  try {
    await pool.query('SELECT 1');
    console.log('✓ PostgreSQL connected for test preparation');
  } catch (err) {
    console.warn('⚠️ Warning: PostgreSQL not reachable directly via pool, testing via HTTP:', err.message);
  }

  // 1. Health & Diagnostics Check
  console.log('1. Testing /health and /api/health endpoint diagnostics...');
  const health = await request('/health');
  if (health.status !== 200 || !health.data.status) {
    throw new Error(`Health check failed: ${JSON.stringify(health)}`);
  }
  if (!health.data.diagnostics || !health.data.diagnostics.jwt) {
    throw new Error(`Diagnostics missing in health response: ${JSON.stringify(health.data)}`);
  }
  console.log(`   ✓ Health check returned OK: ${JSON.stringify(health.data.diagnostics)}\n`);

  // 2. Auth Protection Verification (401 without token)
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

  // 3. User Setup in DB & JWT Auth
  console.log('3. Preparing test user in database...');
  const testMasterId = `master-test-${Date.now()}`;
  const testPhone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;

  try {
    await pool.query(
      `INSERT INTO users (id, phone, ism, familiya, full_name, username, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [testMasterId, testPhone, 'Rustam', 'Karimov', 'Rustam Karimov', `rustam_${testMasterId.slice(-4)}`, 'MASTER']
    );
  } catch (err) {
    console.warn('DB insert via pool notice:', err.message);
  }

  const token = jwt.sign(
    { userId: testMasterId, phone: testPhone, role: 'MASTER' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 4. Authenticated Master Flow
  console.log('4. Testing Authenticated Master Session & Profile...');
  const meRes = await request('/auth/me', { headers: authHeaders });
  if (meRes.status !== 200 || !meRes.data.user) {
    throw new Error(`Get me failed: ${JSON.stringify(meRes)}`);
  }
  console.log(`   ✓ /auth/me returns master: ${meRes.data.user.fullName || meRes.data.user.id}`);

  // Register / update profile
  const regProfile = await request('/auth/register-profile', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ism: 'Rustam', familiya: 'Karimov', role: 'MASTER' }),
  });
  if (regProfile.status !== 200 || regProfile.data.user?.ism !== 'Rustam') {
    throw new Error(`Register profile failed: ${JSON.stringify(regProfile)}`);
  }
  console.log('   ✓ Master profile verified and saved');

  // 5. Services CRUD
  console.log('\n5. Testing Services Management (PostgreSQL storage)...');
  const srvRes = await request('/services', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Klassik soch turmagi',
      price: 70000,
      duration: 30,
      badgeColor: '#A67C2E',
    }),
  });
  if (srvRes.status !== 201 || !srvRes.data.service?.id) {
    throw new Error(`Create service failed: ${JSON.stringify(srvRes)}`);
  }
  const serviceId = srvRes.data.service.id;
  console.log(`   ✓ Service created: ${srvRes.data.service.name} (${srvRes.data.service.price} UZS)`);

  const listServices = await request('/services', { headers: authHeaders });
  if (listServices.status !== 200 || !listServices.data.services.find((s) => s.id === serviceId)) {
    throw new Error(`List services failed: ${JSON.stringify(listServices)}`);
  }
  console.log(`   ✓ Services listed: found ${listServices.data.services.length} active service(s)`);

  // 6. Appointments & Double Booking Conflict (409)
  console.log('\n6. Testing Appointments & Slot Collision Lock (409 Conflict)...');
  const testDate = '2026-10-20';
  const testSlot = '15:00';

  const aptRes1 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Bekzod',
      clientPhone: '+998901112233',
      serviceId,
      date: testDate,
      startTime: testSlot,
    }),
  });
  if (aptRes1.status !== 201 || !aptRes1.data.appointment?.id) {
    throw new Error(`Create appointment 1 failed: ${JSON.stringify(aptRes1)}`);
  }
  const aptId = aptRes1.data.appointment.id;
  console.log(`   ✓ Appointment created on ${testDate} at ${testSlot} (ID: ${aptId})`);

  // Attempt duplicate booking on exact same slot -> MUST return 409
  const aptRes2 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Alisher',
      clientPhone: '+998904445566',
      serviceId,
      date: testDate,
      startTime: testSlot,
    }),
  });
  if (aptRes2.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate appointment, got ${aptRes2.status}: ${JSON.stringify(aptRes2.data)}`);
  }
  console.log('   ✓ Double booking prevented with 409 Conflict (PostgreSQL constraint verified)');

  // Delete appointment
  const delRes = await request(`/appointments/${aptId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (delRes.status !== 200 || !delRes.data.success) {
    throw new Error(`Delete appointment failed: ${JSON.stringify(delRes)}`);
  }
  console.log('   ✓ Appointment deleted / cancelled in PostgreSQL');

  // Re-booking the freed slot should now succeed with 201
  const aptRes3 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Alisher (Re-booked)',
      clientPhone: '+998904445566',
      serviceId,
      date: testDate,
      startTime: testSlot,
    }),
  });
  if (aptRes3.status !== 201 || !aptRes3.data.appointment?.id) {
    throw new Error(`Re-booking freed slot failed: ${JSON.stringify(aptRes3)}`);
  }
  console.log('   ✓ Freed slot successfully re-booked (201 Created)');

  // 7. Booking Requests Flow
  console.log('\n7. Testing Booking Requests Flow...');
  const reqCreate = await request('/booking-requests', {
    method: 'POST',
    body: JSON.stringify({
      masterId: testMasterId,
      clientName: 'Jasur',
      clientPhone: '+998909990011',
      serviceId,
      date: '2026-10-21',
      time: '16:00',
    }),
  });
  if (reqCreate.status !== 201 || !reqCreate.data.request?.id) {
    throw new Error(`Client booking request failed: ${JSON.stringify(reqCreate)}`);
  }
  const bookingReqId = reqCreate.data.request.id;
  console.log(`   ✓ Client submitted booking request (ID: ${bookingReqId})`);

  const listReqs = await request('/booking-requests', { headers: authHeaders });
  if (listReqs.status !== 200 || !listReqs.data.requests.find((r) => r.id === bookingReqId)) {
    throw new Error(`Master list booking requests failed: ${JSON.stringify(listReqs)}`);
  }
  console.log(`   ✓ Master received pending booking request in inbox`);

  const acceptReq = await request(`/booking-requests/${bookingReqId}/accept`, {
    method: 'POST',
    headers: authHeaders,
  });
  if (acceptReq.status !== 200 || !acceptReq.data.appointment) {
    throw new Error(`Accept booking request failed: ${JSON.stringify(acceptReq)}`);
  }
  console.log('   ✓ Master accepted booking request and auto-scheduled appointment in schedule');

  // 8. Salons & Geolocation
  console.log('\n8. Testing Salons & Geolocation Management...');
  const salonCreate = await request('/salons/create', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Barbero Test Salon',
      address: 'Toshkent sh., Chilonzor 1-mavze',
      latitude: 41.2856,
      longitude: 69.2034,
    }),
  });
  if (salonCreate.status !== 201 || !salonCreate.data.salon?.id) {
    throw new Error(`Create salon failed: ${JSON.stringify(salonCreate)}`);
  }
  const testSalonId = salonCreate.data.salon.id;
  console.log(`   ✓ Created salon: ${salonCreate.data.salon.name} (ID: ${testSalonId})`);

  const mySalon = await request('/salons/my', { headers: authHeaders });
  if (mySalon.status !== 200 || !mySalon.data.salon) {
    throw new Error(`Get my salon failed: ${JSON.stringify(mySalon)}`);
  }
  console.log(`   ✓ Master salon verified: ${mySalon.data.salon.name}`);

  // 9. Push Subscription
  console.log('\n9. Testing Push Subscriptions...');
  const pushSub = await request('/push/subscribe', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      subscription: {
        endpoint: `https://updates.push.services.mozilla.com/wpush/v2/test_${Date.now()}`,
        keys: {
          p256dh: 'BNcRdreStoreKeyTestingOnly...',
          auth: 'tBHxAuthKey...',
        },
      },
      device: 'Chrome PWA',
    }),
  });
  if (pushSub.status !== 200 || !pushSub.data.success) {
    throw new Error(`Push subscribe failed: ${JSON.stringify(pushSub)}`);
  }
  console.log('   ✓ Push subscription registered in PostgreSQL');

  const pushStatus = await request('/push/status', { headers: authHeaders });
  if (pushStatus.status !== 200 || !pushStatus.data.isSubscribed) {
    throw new Error(`Push status check failed: ${JSON.stringify(pushStatus)}`);
  }
  console.log(`   ✓ Push subscription verified: active (${pushStatus.data.subscriptionsCount} sub(s))`);

  // 10. Analytics
  console.log('\n10. Testing Analytics Calculation...');
  const analyticsRes = await request('/analytics?period=oy', { headers: authHeaders });
  if (analyticsRes.status !== 200 || !analyticsRes.data.revenue) {
    throw new Error(`Analytics calculation failed: ${JSON.stringify(analyticsRes)}`);
  }
  console.log(`   ✓ Analytics calculated: Revenue ${analyticsRes.data.revenue.formatted}, Bookings: ${analyticsRes.data.revenue.totalBookings}`);

  console.log('\n=======================================================');
  console.log(' 🎉 ALL 10 E2E BARBERO BACKEND TESTS PASSED (100%)');
  console.log('=======================================================\n');
  if (pool) await pool.end();
}

runTests().catch(async (err) => {
  console.error('\n❌ E2E TEST SUITE FAILED:', err.message);
  if (pool) await pool.end().catch(() => {});
  process.exit(1);
});
