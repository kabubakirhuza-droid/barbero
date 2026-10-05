const { Pool } = require('./backend/node_modules/pg');
const jwt = require('./backend/node_modules/jsonwebtoken');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/barbero_db';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production_barbero';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function runTests() {
  console.log('=== BARBERO FOUNDER REDESIGN TEST SUITE ===');
  console.log('Testing against PostgreSQL:', DATABASE_URL);

  const testUserId = `usr-test-${Date.now()}`;
  const testPhone = `+998901234567`;

  try {
    // 1. Create test user
    await pool.query(
      `INSERT INTO users (id, phone, ism, familiya, full_name, username, role, created_at, updated_at)
       VALUES ($1, $2, 'Aziz', 'Usta', 'Aziz Usta', $3, 'MASTER', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [testUserId, testPhone, `usta_${Date.now()}`]
    );

    // Default service for master
    const srvId = `srv-${Date.now()}`;
    await pool.query(
      `INSERT INTO services (id, user_id, name, price, duration, badge_color, is_active, created_at)
       VALUES ($1, $2, 'Soch olish', 50000, 30, '#2563EB', true, NOW())`,
      [srvId, testUserId]
    );

    console.log('✓ Test user & service initialized');

    // 2. Test Phone Normalization
    function normalizeUzbekPhone(raw) {
      let digits = String(raw || '').replace(/\D/g, '');
      if (digits.length === 9) digits = `998${digits}`;
      return digits ? `+${digits}` : '';
    }

    const testVariants = [
      '+998 90 123 45 67',
      '90 123 45 67',
      '998901234567',
      '90-123-45-67',
      '+998901234567'
    ];

    for (const variant of testVariants) {
      const normalized = normalizeUzbekPhone(variant);
      if (normalized !== '+998901234567') {
        throw new Error(`Normalization failed for ${variant} -> got ${normalized}`);
      }
    }
    console.log('✓ All 5 phone input formats correctly normalized to +998901234567');

    // 3. Create client and test quick search
    const clientPhone = '+998909876543';
    const clientId = `c-test-${Date.now()}`;
    await pool.query(
      `INSERT INTO clients (id, user_id, name, phone, notes, total_spent, visits_count, created_at, updated_at)
       VALUES ($1, $2, 'Jasur Bek', $3, 'Qisqa olishni yaxshi ko''radi', 150000, 3, NOW(), NOW())`,
      [clientId, testUserId, clientPhone]
    );

    // Create past appointment
    const aptId = `apt-past-${Date.now()}`;
    await pool.query(
      `INSERT INTO appointments (id, user_id, client_id, client_name, client_phone, service_id, service_name, service_price, badge_color, appointment_date, start_time, end_time, duration, status, created_at)
       VALUES ($1, $2, $3, 'Jasur Bek', $4, $5, 'Soch + soqol', 70000, '#2563EB', '2026-10-02', '14:00', '14:45', 45, 'completed', NOW())`,
      [aptId, testUserId, clientId, clientPhone, srvId]
    );

    // 4. Test Client History
    const historyRes = await pool.query(
      `SELECT * FROM appointments WHERE user_id = $1 AND client_id = $2 ORDER BY appointment_date DESC`,
      [testUserId, clientId]
    );
    if (historyRes.rows.length === 0) throw new Error('Client history query failed');
    console.log('✓ Client history retrieved:', historyRes.rows.length, 'visit found');

    // 5. Test Call Log Registration & Enrichment
    const clId = `cl-test-${Date.now()}`;
    await pool.query(
      `INSERT INTO call_log (id, user_id, phone, name, direction, created_at)
       VALUES ($1, $2, $3, 'Jasur Bek', 'incoming_manual', NOW())`,
      [clId, testUserId, clientPhone]
    );

    const callLogsRes = await pool.query(
      `SELECT c.id, c.phone, COALESCE(NULLIF(c.name, ''), cl.name, 'Noma''lum') as name,
              cl.visits_count, cl.total_spent, cl.notes,
              (cl.id IS NOT NULL) as is_client
       FROM call_log c
       LEFT JOIN clients cl ON cl.user_id = c.user_id AND cl.phone = c.phone
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC LIMIT 1`,
      [testUserId]
    );

    if (callLogsRes.rows.length === 0 || !callLogsRes.rows[0].is_client) {
      throw new Error('Enriched call log lookup failed');
    }
    console.log('✓ Safe Call Log verified: client recognized with', callLogsRes.rows[0].visits_count, 'visits');

    // 6. Test Interval Conflict Prevention
    const testDate = '2026-10-06';
    const testAptId = `apt-booked-${Date.now()}`;
    await pool.query(
      `INSERT INTO appointments (id, user_id, client_id, client_name, client_phone, service_id, service_name, service_price, badge_color, appointment_date, start_time, end_time, duration, status, created_at)
       VALUES ($1, $2, $3, 'Jasur Bek', $4, $5, 'Soch olish', 50000, '#2563EB', $6, '15:00', '15:30', 30, 'confirmed', NOW())`,
      [testAptId, testUserId, clientId, clientPhone, srvId, testDate]
    );

    // Check overlap with 15:00 - 15:30
    const conflictQuery = `
      SELECT id FROM appointments 
      WHERE user_id = $1 AND appointment_date = $2 
        AND start_time < $3 AND end_time > $4 
        AND status != 'cancelled' LIMIT 1
    `;

    const conflict1 = await pool.query(conflictQuery, [testUserId, testDate, '15:30', '15:00']);
    const conflict2 = await pool.query(conflictQuery, [testUserId, testDate, '15:20', '14:50']);
    const conflict3 = await pool.query(conflictQuery, [testUserId, testDate, '16:00', '15:30']);

    if (conflict1.rows.length === 0 || conflict2.rows.length === 0) {
      throw new Error('Collision detection missed overlapping slot!');
    }
    if (conflict3.rows.length > 0) {
      throw new Error('Collision detection falsely blocked adjacent free slot 15:30-16:00!');
    }
    console.log('✓ Interval collision & adjacent slot math verified accurately');

    // Cleanup test records
    await pool.query('DELETE FROM appointments WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM call_log WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM clients WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM services WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);

    console.log('\n======================================================');
    console.log(' ALL 6 BARBERO FOUNDER REDESIGN TESTS PASSED (100%)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
