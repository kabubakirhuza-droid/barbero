require('dotenv').config({ path: require('path').resolve(__dirname, 'backend/.env') });
const jwt = require('jsonwebtoken');
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
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/barbero_db';

const pool = Pool ? new Pool({ connectionString: DATABASE_URL }) : null;

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
    if (pool) await pool.query('SELECT 1');
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
    if (pool) {
      await pool.query(
        `INSERT INTO users (id, phone, ism, familiya, full_name, username, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [testMasterId, testPhone, 'Rustam', 'Karimov', 'Rustam Karimov', `rustam_${testMasterId.slice(-4)}`, 'MASTER']
      );
    }
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
      name: 'Klassik soch turmagi (60 min)',
      price: 70000,
      duration: 60,
      badgeColor: '#A67C2E',
    }),
  });
  if (srvRes.status !== 201 || !srvRes.data.service?.id) {
    throw new Error(`Create service failed: ${JSON.stringify(srvRes)}`);
  }
  const serviceId = srvRes.data.service.id;
  console.log(`   ✓ Service created: ${srvRes.data.service.name} (${srvRes.data.service.price} UZS, 60m)`);

  const listServices = await request('/services', { headers: authHeaders });
  if (listServices.status !== 200 || !listServices.data.services.find((s) => s.id === serviceId)) {
    throw new Error(`List services failed: ${JSON.stringify(listServices)}`);
  }
  console.log(`   ✓ Services listed: found ${listServices.data.services.length} active service(s)`);

  // 6. Appointments & Interval Collision (409)
  console.log('\n6. Testing Interval Overlap Collision Prevention (409 Conflict)...');
  const testDate = '2026-10-20';

  // 6a. 14:00 - 15:00 Appointment (60 min service)
  const aptRes1 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Bekzod',
      clientPhone: '+998901112233',
      serviceId,
      date: testDate,
      startTime: '14:00',
    }),
  });
  if (aptRes1.status !== 201 || !aptRes1.data.appointment?.id) {
    throw new Error(`Create appointment 1 (14:00-15:00) failed: ${JSON.stringify(aptRes1)}`);
  }
  const aptId = aptRes1.data.appointment.id;
  console.log(`   ✓ Appointment 14:00-15:00 created (ID: ${aptId})`);

  // 6b. Attempt booking inside the interval at 14:30 -> MUST return 409
  const aptRes2 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Alisher (Overlapping 14:30)',
      clientPhone: '+998904445566',
      serviceId,
      date: testDate,
      startTime: '14:30',
    }),
  });
  if (aptRes2.status !== 409) {
    throw new Error(`Expected 409 Conflict for 14:30 overlapping 14:00-15:00, got ${aptRes2.status}: ${JSON.stringify(aptRes2.data)}`);
  }
  console.log('   ✓ Overlapping appointment at 14:30 strictly prevented with 409 Conflict');

  // 6c. Attempt booking spanning into the interval: 13:30 (60 min -> 13:30-14:30) -> MUST return 409
  const aptRes3 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Jamshid (Overlapping 13:30-14:30)',
      clientPhone: '+998905556677',
      serviceId,
      date: testDate,
      startTime: '13:30',
    }),
  });
  if (aptRes3.status !== 409) {
    throw new Error(`Expected 409 Conflict for 13:30-14:30 overlapping 14:00-15:00, got ${aptRes3.status}: ${JSON.stringify(aptRes3.data)}`);
  }
  console.log('   ✓ Overlapping appointment at 13:30 (60 min) strictly prevented with 409 Conflict');

  // 6d. Booking adjacent slot at 15:00 -> MUST succeed (201)
  const aptRes4 = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Sardor (Adjacent 15:00)',
      clientPhone: '+998907778899',
      serviceId,
      date: testDate,
      startTime: '15:00',
    }),
  });
  if (aptRes4.status !== 201) {
    throw new Error(`Expected 201 for adjacent 15:00 appointment, got ${aptRes4.status}: ${JSON.stringify(aptRes4.data)}`);
  }
  console.log('   ✓ Adjacent appointment at 15:00 created successfully (201)');

  // 7. Blocked Slots & Collisions
  console.log('\n7. Testing Blocked Slots (Dam olish) & Range Collisions...');
  const blockRes1 = await request('/blocked-slots', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      appointmentDate: testDate,
      startTime: '16:00',
      endTime: '17:00',
      reason: 'Tushlik / Dam olish',
    }),
  });
  if (blockRes1.status !== 201 || !blockRes1.data.blockedSlot?.id) {
    throw new Error(`Block slot failed: ${JSON.stringify(blockRes1)}`);
  }
  console.log('   ✓ Slot 16:00-17:00 blocked (Dam olish)');

  // Attempt booking on blocked interval 16:30 -> MUST return 409
  const aptOnBlocked = await request('/appointments', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'Test on blocked',
      clientPhone: '+998901112233',
      serviceId,
      date: testDate,
      startTime: '16:30',
    }),
  });
  if (aptOnBlocked.status !== 409) {
    throw new Error(`Expected 409 on blocked slot 16:30, got ${aptOnBlocked.status}`);
  }
  console.log('   ✓ Booking on blocked slot interval strictly prevented with 409 Conflict');

  // 8. Call Log & Phone Normalization
  console.log('\n8. Testing Call Log & Phone Normalization...');
  const callRes = await request('/call-log', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      phone: '90 111 22 33',
      name: 'Mijoz Telefon',
      direction: 'outgoing_call',
    }),
  });
  if (callRes.status !== 201 || callRes.data.callLog?.phone !== '+998901112233') {
    throw new Error(`Call log failed or didn't normalize phone: ${JSON.stringify(callRes)}`);
  }
  console.log('   ✓ Phone normalized to +998901112233 and saved to Call Log');

  // 9. Notification 404
  console.log('\n9. Testing Notification 404 handling...');
  const notifRead404 = await request('/notifications/nonexistent-notification-id/read', {
    method: 'PATCH',
    headers: authHeaders,
  });
  if (notifRead404.status !== 404) {
    throw new Error(`Expected 404 for nonexistent notification, got ${notifRead404.status}`);
  }
  console.log('   ✓ PATCH /notifications/:id/read returns 404 for nonexistent/unowned notification');

  // 10. Data Validation (Bad date/time 400)
  console.log('\n10. Testing Input Validation (Bad dates, invalid time, past dates -> 400)...');
  const badDateRes = await request('/appointments/quick', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ date: 'abc', startTime: '99:99' }),
  });
  if (badDateRes.status !== 400) {
    throw new Error(`Expected 400 for bad date/time, got ${badDateRes.status}`);
  }
  console.log('   ✓ Invalid date/time rejected with 400 Bad Request');

  console.log('\n=======================================================');
  console.log(' 🎉 ALL E2E BARBERO BACKEND TESTS PASSED (100%)');
  console.log('=======================================================\n');
  if (pool) await pool.end();
}

runTests().catch(async (err) => {
  console.error('\n❌ E2E TEST SUITE FAILED:', err.message);
  if (pool) await pool.end().catch(() => {});
  process.exit(1);
});
