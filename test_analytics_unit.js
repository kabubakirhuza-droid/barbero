// Unit tests for analytics calculations, date ranges, and Asia/Tashkent timezone
const assert = require('assert');

// Helper to format date in Tashkent timezone (UTC+5)
function getTashkentDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

function parseYMD(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDays(str, days) {
  const d = parseYMD(str);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function getDaysDiff(from, to) {
  const d1 = parseYMD(from);
  const d2 = parseYMD(to);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
}

// 1. Test Timezone Formatter
console.log('1. Testing Asia/Tashkent Timezone Calculation...');
const testDate = new Date('2026-10-04T00:00:00Z');
// In UTC it's 2026-10-04, in Tashkent (+5) it's 2026-10-04 05:00
assert.strictEqual(getTashkentDateString(testDate), '2026-10-04');

const lateNightUTC = new Date('2026-10-03T20:00:00Z');
// In Tashkent (+5), 20:00 UTC is 01:00 on 2026-10-04
assert.strictEqual(getTashkentDateString(lateNightUTC), '2026-10-04');
console.log('   ✓ Tashkent date boundary accurately computed');

// 2. Test Date Range calculations
console.log('2. Testing Date Range calculations...');
const diff = getDaysDiff('2026-10-01', '2026-10-07');
assert.strictEqual(diff, 7);

const prevTo = addDays('2026-10-01', -1);
assert.strictEqual(prevTo, '2026-09-30');
const prevFrom = addDays(prevTo, -(diff - 1));
assert.strictEqual(prevFrom, '2026-09-24');
console.log('   ✓ Previous period date alignment verified');

// 3. Test Revenue & Growth Calculation
console.log('3. Testing Revenue and Growth Rates...');
const currentAppointments = [
  { servicePrice: 50000, clientPhone: '+998901112233', date: '2026-10-01', status: 'confirmed' },
  { servicePrice: 70000, clientPhone: '+998902223344', date: '2026-10-02', status: 'completed' },
  { servicePrice: 30000, clientPhone: '+998901112233', date: '2026-10-04', status: 'confirmed' },
];

const totalRevenue = currentAppointments.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
assert.strictEqual(totalRevenue, 150000);

const prevRevenue = 100000;
const growthRate = `${Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)}%`;
assert.strictEqual(growthRate, '50%');
console.log('   ✓ Total revenue and +50% growth rate calculated correctly');

// 4. Test Unique and New Clients
console.log('4. Testing Unique and First-Time Client Analytics...');
const allHistory = [
  { clientPhone: '+998901112233', date: '2026-08-15' }, // Old client
  { clientPhone: '+998902223344', date: '2026-10-02' }, // New client (first ever)
];

const clientPhones = new Set(currentAppointments.map(a => a.clientPhone));
assert.strictEqual(clientPhones.size, 2);

let newClientsCount = 0;
clientPhones.forEach(phone => {
  const clientHistory = allHistory.filter(a => a.clientPhone === phone);
  clientHistory.sort((a, b) => a.date.localeCompare(b.date));
  if (clientHistory.length > 0 && clientHistory[0].date >= '2026-10-01' && clientHistory[0].date <= '2026-10-07') {
    newClientsCount += 1;
  }
});
assert.strictEqual(newClientsCount, 1);
console.log('   ✓ Unique clients: 2, New clients: 1 correctly identified');

console.log('\n========================================');
console.log(' ALL ANALYTICS UNIT TESTS PASSED (100%)');
console.log('========================================\n');
