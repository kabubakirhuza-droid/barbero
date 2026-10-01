// Comprehensive E2E test script for Usta Backend API
const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('--- 🧪 STARTING USTA BACKEND E2E TESTS ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ [FAIL] ${name}:`, e.message);
      failed++;
    }
  }

  // 1. Health
  await test('GET /health', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Status not ok');
  });

  // 2. Auth - Send Code
  let testCode = '';
  let requestId = '';
  await test('POST /auth/send-code', async () => {
    const res = await fetch(`${BASE_URL}/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+998900335102' }),
    });
    const data = await res.json();
    if (!data.success && !data.requestId) throw new Error('Failed to send code');
    testCode = data.testCode || '123456';
    requestId = data.requestId;
  });

  // 3. Auth - Telegram Gateway Real Verification (invalid code check)
  let accessToken = '';
  await test('POST /auth/verify - rejects invalid code via Telegram Gateway', async () => {
    const res = await fetch(`${BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '+998900335102',
        code: '999999', // Non-matching code
        requestId,
      }),
    });
    const data = await res.json();
    if (res.status === 400 && data.error) {
      // Expected: Telegram Gateway verified that 999999 is invalid or session rate limit applied
      console.log(`    ℹ️ Expected rejection: "${data.error}"`);
    } else {
      throw new Error('Expected 400 rejection from Telegram Gateway on wrong code');
    }
  });

  // Generate valid test JWT token for remaining protected endpoints
  const jwt = require('jsonwebtoken');
  accessToken = jwt.sign({ userId: 'u-1', phone: '+998900335102' }, 'usta_super_jwt_secret_key_2026', { expiresIn: '1h' });

  // 4. Auth - Me
  await test('GET /auth/me', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!data.user?.fullName) throw new Error('User not found');
  });

  // 5. Services - List
  await test('GET /services', async () => {
    const res = await fetch(`${BASE_URL}/services`);
    const data = await res.json();
    if (!Array.isArray(data.services) || data.services.length === 0) {
      throw new Error('Services list empty');
    }
  });

  // 6. Services - Create
  let createdServiceId = '';
  await test('POST /services', async () => {
    const res = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kreativ soqol tekislash',
        price: 45000,
        duration: 25,
        badgeColor: '#059669',
      }),
    });
    const data = await res.json();
    if (!data.success || !data.service?.id) throw new Error('Failed creating service');
    createdServiceId = data.service.id;
  });

  // 7. Appointments - List for today
  await test('GET /appointments', async () => {
    const res = await fetch(`${BASE_URL}/appointments`);
    const data = await res.json();
    if (!Array.isArray(data.appointments)) throw new Error('Appointments not array');
  });

  // 8. Appointments - Create
  let createdAptId = '';
  await test('POST /appointments', async () => {
    const res = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Sardor A.',
        clientPhone: '+998907778899',
        serviceId: createdServiceId,
        serviceName: 'Kreativ soqol tekislash',
        servicePrice: 45000,
        badgeColor: '#059669',
        date: '2026-09-29',
        startTime: '16:00',
        duration: 30,
      }),
    });
    const data = await res.json();
    if (!data.success || !data.appointment?.id) throw new Error('Failed to create appointment');
    createdAptId = data.appointment.id;
  });

  // 9. Appointments - Update
  await test('PUT /appointments/:id', async () => {
    const res = await fetch(`${BASE_URL}/appointments/${createdAptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Sardorbek Aliyev',
      }),
    });
    const data = await res.json();
    if (!data.success || data.appointment.clientName !== 'Sardorbek Aliyev') {
      throw new Error('Failed updating appointment');
    }
  });

  // 10. Clients - List
  await test('GET /clients', async () => {
    const res = await fetch(`${BASE_URL}/clients`);
    const data = await res.json();
    if (!Array.isArray(data.clients) || data.clients.length === 0) {
      throw new Error('Clients list empty');
    }
  });

  // 11. Analytics - Period Month
  await test('GET /analytics?period=oy', async () => {
    const res = await fetch(`${BASE_URL}/analytics?period=oy`);
    const data = await res.json();
    if (!data.revenue || !data.metrics || !data.dynamics?.chart) {
      throw new Error('Analytics invalid structure');
    }
  });


  // 13. Portfolio - Photos & Like
  await test('GET & POST /portfolio', async () => {
    const res = await fetch(`${BASE_URL}/portfolio`);
    const data = await res.json();
    if (!data.photos || data.photos.length === 0) throw new Error('No portfolio photos');

    const photoId = data.photos[0].id;
    const likeRes = await fetch(`${BASE_URL}/portfolio/${photoId}/like`, { method: 'POST' });
    const likeData = await likeRes.json();
    if (!likeData.success) throw new Error('Failed liking photo');
  });

  // 14. Profile & Working Hours
  await test('GET /profile & /profile/working-hours', async () => {
    const pRes = await fetch(`${BASE_URL}/profile`);
    const pData = await pRes.json();
    if (!pData.user || !pData.subscription) throw new Error('Profile invalid');

    const whRes = await fetch(`${BASE_URL}/profile/working-hours`);
    const whData = await whRes.json();
    if (!whData.workingHours || whData.workingHours.length !== 7) {
      throw new Error('Working hours not 7 days');
    }
  });

  // 15. Public Booking - planr.uz/b/abubakir
  await test('Public Booking: GET & POST /public/b/abubakir', async () => {
    const infoRes = await fetch(`${BASE_URL}/public/b/abubakir`);
    const infoData = await infoRes.json();
    if (!infoData.master || !infoData.services) throw new Error('Public master info missing');

    const slotsRes = await fetch(`${BASE_URL}/public/b/abubakir/available-slots?date=2026-09-29`);
    const slotsData = await slotsRes.json();
    if (!Array.isArray(slotsData.slots)) throw new Error('Slots not array');

    const availableSlot = slotsData.slots.find((s) => s.isAvailable)?.time || '19:30';

    const bookRes = await fetch(`${BASE_URL}/public/b/abubakir/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'Nodirbek',
        clientPhone: '+998909990011',
        serviceId: infoData.services[0].id,
        date: '2026-09-29',
        startTime: availableSlot,
      }),
    });
    const bookData = await bookRes.json();
    if (!bookData.success || !bookData.appointment) throw new Error(`Public booking failed: ${JSON.stringify(bookData)}`);
  });

  // 16. Booking Requests: POST, GET, ACCEPT
  await test('Booking Requests: submit, list, accept', async () => {
    // 16.1 Client submits booking request from public link
    const postRes = await fetch(`${BASE_URL}/booking-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterId: 'u-1',
        clientName: 'Azamat Qosimov',
        clientPhone: '+998901112233',
        serviceId: 'srv-1',
        date: '2026-09-29',
        time: '16:30',
      }),
    });
    const postData = await postRes.json();
    if (!postData.success || !postData.request?.id) throw new Error('Create booking request failed');
    const reqId = postData.request.id;

    // 16.2 Master fetches list of pending booking requests
    const listRes = await fetch(`${BASE_URL}/booking-requests?masterId=u-1`);
    const listData = await listRes.json();
    if (!Array.isArray(listData.requests) || listData.requests.length === 0) {
      throw new Error('List booking requests empty');
    }

    // 16.3 Master accepts request -> creates appointment in schedule
    const acceptRes = await fetch(`${BASE_URL}/booking-requests/${reqId}/accept`, {
      method: 'POST',
    });
    const acceptData = await acceptRes.json();
    if (!acceptData.success || !acceptData.appointment) throw new Error('Accept booking request failed');
  });

  console.log(`\n🎉 RESULTS: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
