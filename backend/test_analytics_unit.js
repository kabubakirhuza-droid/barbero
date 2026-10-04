// Unit tests for Barbero Analytics calculations and edge cases
const assert = require('assert');

function formatUzs(amount) {
  const num = Math.round(Number(amount) || 0);
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} uzs`;
}

function calculateGrowth(current, previous) {
  if (previous === 0) {
    return {
      growthPercent: current > 0 ? 100 : 0,
      growthFormatted: current > 0 ? 'Yangi' : '0%',
      isPositive: current > 0,
    };
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  const formatted = pct >= 0 ? `+${pct}%` : `${pct}%`;
  return {
    growthPercent: pct,
    growthFormatted: formatted,
    isPositive: pct >= 0,
  };
}

function calculateAvgPayment(totalRevenue, totalBookings) {
  if (totalBookings <= 0 || totalRevenue <= 0) return 0;
  return Math.round(totalRevenue / totalBookings);
}

function calculateOccupancy(activeBookingDaysCount, masterWorkingDaysInPeriod) {
  const ratioText = `${activeBookingDaysCount}/${masterWorkingDaysInPeriod} kun`;
  const percent = masterWorkingDaysInPeriod > 0
    ? Math.min(100, Math.round((activeBookingDaysCount / masterWorkingDaysInPeriod) * 100))
    : 0;
  return {
    percent,
    ratioText,
  };
}

function validateDateRange(fromStr, toStr) {
  if (!fromStr || !toStr) return { valid: true };
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return { valid: false, message: "Noto'g'ri sana formati" };
  }
  if (from > to) {
    return { valid: false, message: "Boshlanish sanasi tugashdan keyin bo'lishi mumkin emas" };
  }
  return { valid: true };
}

console.log('--- 🧪 STARTING BARBERO ANALYTICS UNIT TESTS ---');

// 1. Currency Formatting
assert.strictEqual(formatUzs(1190000), '1 190 000 uzs', 'Currency format 1 190 000 uzs failed');
assert.strictEqual(formatUzs(0), '0 uzs', 'Zero currency format failed');
assert.strictEqual(formatUzs(45000), '45 000 uzs', 'Currency format 45 000 uzs failed');
assert.strictEqual(formatUzs(500), '500 uzs', 'Currency format 500 uzs failed');
console.log('✅ [PASS] Currency formatting (1 190 000 uzs)');

// 2. Growth calculation with 0 previous (Avoid division by zero & show 'Yangi')
const zeroPrevGrowth = calculateGrowth(500000, 0);
assert.strictEqual(zeroPrevGrowth.growthFormatted, 'Yangi', 'Zero previous should be "Yangi"');
assert.strictEqual(zeroPrevGrowth.isPositive, true);

const bothZeroGrowth = calculateGrowth(0, 0);
assert.strictEqual(bothZeroGrowth.growthFormatted, '0%', 'Both zero should be 0%');

const normalPositiveGrowth = calculateGrowth(150000, 100000);
assert.strictEqual(normalPositiveGrowth.growthFormatted, '+50%');

const normalNegativeGrowth = calculateGrowth(80000, 100000);
assert.strictEqual(normalNegativeGrowth.growthFormatted, '-20%');
console.log('✅ [PASS] Growth calculation with zero-division safeguard & "Yangi" badge');

// 3. Average payment calculation
assert.strictEqual(calculateAvgPayment(0, 0), 0, 'Zero bookings avg payment must be 0');
assert.strictEqual(calculateAvgPayment(100000, 0), 0, 'Zero bookings with revenue must be 0');
assert.strictEqual(calculateAvgPayment(1190000, 10), 119000, 'Avg payment 10 bookings');
console.log('✅ [PASS] Average payment calculation');

// 4. Occupancy calculation (N/M kun)
const occ1 = calculateOccupancy(5, 6);
assert.strictEqual(occ1.ratioText, '5/6 kun');
assert.strictEqual(occ1.percent, 83);

const occZero = calculateOccupancy(0, 0);
assert.strictEqual(occZero.ratioText, '0/0 kun');
assert.strictEqual(occZero.percent, 0);
console.log('✅ [PASS] Occupancy calculation (N/M kun)');

// 5. Date range validation
const validRange = validateDateRange('2026-10-01', '2026-10-10');
assert.strictEqual(validRange.valid, true);

const invalidRange = validateDateRange('2026-10-15', '2026-10-05');
assert.strictEqual(invalidRange.valid, false);
assert.strictEqual(invalidRange.message, "Boshlanish sanasi tugashdan keyin bo'lishi mumkin emas");
console.log('✅ [PASS] Date range validation (Boshlanish sanasi tugashdan keyin bo\'lishi mumkin emas)');

console.log('🎉 ALL 5 ANALYTICS UNIT TESTS PASSED SUCCESSFULLY!');
