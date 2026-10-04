// Comprehensive E2E test script for Barbero Backend API
const BASE_URL = 'http://127.0.0.1:5000';
const jwt = require('jsonwebtoken');

async function runTests() {
  console.log('--- 🧪 STARTING BARBERO BACKEND E2E TESTS ---');
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
  let requestId = '';
  await test('POST /auth/send-code', async () => {
    const res = await fetch(`${BASE_URL}/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+998900335102' }),
    });
    const data = await res.json();
    if (!data.success && !data.requestId) throw new Error('Failed to send code');
    requestId = data.requestId;
  });

  // 3. Auth - Telegram Gateway Real Verification (invalid code check)
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
      console.log(`    ℹ️ Expected rejection: "${data.error}"`);
    } else {
      throw new Error('Expected 400 rejection from Telegram Gateway on wrong code');
    }
  });

  // Generate valid test JWT token for remaining protected endpoints
  const accessToken = jwt.sign(
    { userId: 'u-1', phone: '+998900335102' },
    process.env.JWT_SECRET || 'barbero_super_jwt_secret_key_2026',
    { expiresIn: '1h' }
  );

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

  // 7. Appointments - List
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
        date: '2026-10-03',
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

  // 11. Analytics - Period Hafta
  await test('GET /analytics?period=hafta', async () => {
    const res = await fetch(`${BASE_URL}/analytics?period=hafta`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!data.revenue || !data.metrics || !data.dynamics?.chart) {
      throw new Error('Analytics invalid structure for hafta');
    }
    if (data.period !== 'hafta') throw new Error('Incorrect period in response');
  });

  // 12. Analytics - Period Oy
  await test('GET /analytics?period=oy', async () => {
    const res = await fetch(`${BASE_URL}/analytics?period=oy`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!data.revenue?.amountFormatted || !data.metrics?.clients?.countFormatted) {
      throw new Error('Analytics missing formatted fields');
    }
    if (typeof data.metrics.occupancy?.percent !== 'number') {
      throw new Error('Occupancy percent missing');
    }
  });

  // 13. Analytics - Period Yil
  await test('GET /analytics?period=yil', async () => {
    const res = await fetch(`${BASE_URL}/analytics?period=yil`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.period !== 'yil' || data.dynamics.group !== 'month') {
      throw new Error('Yearly analytics grouping incorrect');
    }
  });

  // 14. Analytics - Custom range valid & invalid
  await test('GET /analytics with custom range (valid & invalid)', async () => {
    // Valid custom range
    const validRes = await fetch(`${BASE_URL}/analytics?from=2026-09-01&to=2026-10-03`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const validData = await validRes.json();
    if (!validData.revenue) throw new Error('Valid range failed');

    // Invalid custom range: from > to
    const invalidRes = await fetch(`${BASE_URL}/analytics?from=2026-10-10&to=2026-10-01`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const invalidData = await invalidRes.json();
    if (invalidRes.status !== 400 || !invalidData.error) {
      throw new Error('Expected 400 validation error for from > to');
    }
  });

  // 15. Web Push - VAPID Public Key
  await test('GET /push/vapid-public-key', async () => {
    const res = await fetch(`${BASE_URL}/push/vapid-public-key`);
    const data = await res.json();
    if (!data.publicKey || typeof data.publicKey !== 'string') {
      throw new Error('VAPID public key missing or invalid');
    }
  });

  // 16. Web Push - Subscribe & Status & Test & Unsubscribe
  await test('Web Push: Subscribe, Status, Test, Unsubscribe', async () => {
    const testSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-token-12345',
      keys: {
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
        auth: 'tBHItJI5svbpez7KI4CCXg',
      },
    };

    // Subscribe
    const subRes = await fetch(`${BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        subscription: testSubscription,
        device: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      }),
    });
    const subData = await subRes.json();
    if (!subData.success) throw new Error(`Subscribe failed: ${JSON.stringify(subData)}`);

    // Status
    const statusRes = await fetch(`${BASE_URL}/push/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const statusData = await statusRes.json();
    if (!statusData.isSubscribed || statusData.subscriptionsCount < 1) {
      throw new Error('Push status indicates not subscribed');
    }

    // Unsubscribe
    const unsubRes = await fetch(`${BASE_URL}/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint: testSubscription.endpoint,
      }),
    });
    const unsubData = await unsubRes.json();
    if (!unsubData.success) throw new Error('Unsubscribe failed');
  });

  // 17. Portfolio - Photos & Like
  await test('GET & POST /portfolio', async () => {
    const res = await fetch(`${BASE_URL}/portfolio`);
    const data = await res.json();
    if (!data.photos || data.photos.length === 0) throw new Error('No portfolio photos');

    const photoId = data.photos[0].id;
    const likeRes = await fetch(`${BASE_URL}/portfolio/${photoId}/like`, { method: 'POST' });
    const likeData = await likeRes.json();
    if (!likeData.success) throw new Error('Failed liking photo');
  });

  // 18. Profile & Working Hours
  await test('GET /profile & /profile/working-hours', async () => {
    const pRes = await fetch(`${BASE_URL}/profile`);
    const pData = await pRes.json();
    if (!pData.user) throw new Error('Profile user missing');

    const whRes = await fetch(`${BASE_URL}/profile/working-hours`);
    const whData = await whRes.json();
    if (!whData.workingHours || whData.workingHours.length !== 7) {
      throw new Error('Working hours not 7 days');
    }
  });

  // 19. Public Booking - /public/b/abubakir
  await test('Public Booking: GET & POST /public/b/abubakir', async () => {
    const infoRes = await fetch(`${BASE_URL}/public/b/abubakir`);
    const infoData = await infoRes.json();
    if (!infoData.master || !infoData.services) throw new Error('Public master info missing');

    const slotsRes = await fetch(`${BASE_URL}/public/b/abubakir/available-slots?date=2026-10-03`);
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
        date: '2026-10-03',
        startTime: availableSlot,
      }),
    });
    const bookData = await bookRes.json();
    if (!bookData.success || !bookData.appointment) throw new Error(`Public booking failed: ${JSON.stringify(bookData)}`);
  });

  // 20. Booking Requests: POST, GET, ACCEPT (triggers push to master)
  await test('Booking Requests: submit, list, accept', async () => {
    // 20.1 Client submits booking request from public link
    const postRes = await fetch(`${BASE_URL}/booking-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterId: 'u-1',
        clientName: 'Azamat Qosimov',
        clientPhone: '+998901112233',
        serviceId: 'srv-1',
        date: '2026-10-03',
        time: '16:30',
      }),
    });
    const postData = await postRes.json();
    if (!postData.success || !postData.request?.id) throw new Error('Create booking request failed');
    const reqId = postData.request.id;

    // 20.2 Master fetches list of pending booking requests
    const listRes = await fetch(`${BASE_URL}/booking-requests?masterId=u-1`);
    const listData = await listRes.json();
    if (!Array.isArray(listData.requests) || listData.requests.length === 0) {
      throw new Error('List booking requests empty');
    }

    // 20.3 Master accepts request -> creates appointment in schedule
    const acceptRes = await fetch(`${BASE_URL}/booking-requests/${reqId}/accept`, {
      method: 'POST',
    });
    const acceptData = await acceptRes.json();
    if (!acceptData.success || !acceptData.appointment) throw new Error('Accept booking request failed');
  });

  console.log(`\n🎉 ALL TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
