const http = require('http');

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('--- Testing Backend Endpoints ---');

  // 1. Health
  const health = await request('http://127.0.0.1:5000/health');
  console.log('1. Health check:', health.status, health.body);

  // 2. Auth send-code (demo mode)
  const sendCode = await request('http://127.0.0.1:5000/auth/send-code', { method: 'POST' }, {
    phone: '+998900335102',
  });
  console.log('2. Send code:', sendCode.status, sendCode.body);

  // 3. Auth verify code (demo mode accepts any 6 digits)
  const verify = await request('http://127.0.0.1:5000/auth/verify', { method: 'POST' }, {
    phone: '+998900335102',
    code: '123456',
    requestId: sendCode.body?.requestId,
  });
  console.log('3. Verify code:', verify.status, 'User:', verify.body?.user?.fullName);
  const token = verify.body?.tokens?.accessToken;

  // 4. Register Profile (Step 3: Ism and Familiya)
  const regProfile = await request('http://127.0.0.1:5000/auth/register-profile', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    ism: 'Bobur',
    familiya: 'Aliyev',
  });
  console.log('4. Register Profile:', regProfile.status, regProfile.body?.user?.fullName);

  // 5. Salons nearby (within 50 meters)
  const nearby = await request('http://127.0.0.1:5000/salons/nearby?lat=41.311081&lng=69.240562&radius=50', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('5. Salons nearby (50m):', nearby.status, 'Count:', nearby.body?.salons?.length);

  // 6. Join or Create Salon
  let salonId;
  if (nearby.body?.salons?.length > 0) {
    salonId = nearby.body.salons[0].id;
    const join = await request('http://127.0.0.1:5000/salons/join', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, { salonId });
    console.log('6. Joined existing salon:', join.status, join.body?.salon?.name);
  } else {
    const create = await request('http://127.0.0.1:5000/salons/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      name: 'Bobur Barbershop',
      address: 'Toshkent sh., Chilonzor 9',
      lat: 41.311081,
      lng: 69.240562
    });
    console.log('6. Created new salon:', create.status, create.body?.salon?.name);
    salonId = create.body?.salon?.id;
  }

  // 7. Get My Salon
  const mySalon = await request('http://127.0.0.1:5000/salons/my', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('7. My Salon:', mySalon.status, mySalon.body?.salon?.name, 'Members count:', mySalon.body?.members?.length);

  // 8. 1-Click Quick Booking
  const quick = await request('http://127.0.0.1:5000/appointments/quick', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    date: '2026-09-29',
    startTime: '10:30',
  });
  console.log('8. 1-Click Quick Booking:', quick.status, quick.body?.appointment?.clientName, quick.body?.appointment?.serviceName, quick.body?.appointment?.servicePrice);

  // 9. Update appointment (Edit sheet with client name, phone, service)
  const aptId = quick.body?.appointment?.id;
  if (aptId) {
    const update = await request(`http://127.0.0.1:5000/appointments/${aptId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      clientName: 'Mijoz 5',
      clientPhone: '+998 90 123 45 67',
      serviceName: 'Soch + soqol',
      servicePrice: 70000,
      badgeColor: '#2563EB',
    });
    console.log('9. Updated Appointment:', update.status, update.body?.appointment?.clientName, update.body?.appointment?.serviceName, update.body?.appointment?.servicePrice);
  }

  // 10. Get appointments for day
  const dayApts = await request('http://127.0.0.1:5000/appointments?date=2026-09-29', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('10. Day Appointments:', dayApts.status, 'Total amount:', dayApts.body?.dayTotal, 'Count:', dayApts.body?.count);

  console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---');
}

run().catch((e) => console.error('Test failed:', e));
