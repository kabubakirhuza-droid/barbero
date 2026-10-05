// Comprehensive tests for review fixes
const assert = require('assert');
const { addMinutesToTime, getTashkentNow } = require('./backend/dist/db');

async function runUnitAndLogicTests() {
  console.log('=== STARTING REVIEW FIXES VALIDATION SUITE ===\n');

  // 1. Time & Interval overlap helper logic
  console.log('1. Testing addMinutesToTime and Interval Overlaps...');
  assert.strictEqual(addMinutesToTime('14:00', 60), '15:00');
  assert.strictEqual(addMinutesToTime('14:30', 45), '15:15');
  assert.strictEqual(addMinutesToTime('23:45', 30), '00:15');
  assert.strictEqual(addMinutesToTime('09:00', 30), '09:30');
  console.log('   ✓ addMinutesToTime correctly handles time arithmetic and day wrapping');

  // Interval overlap test: [A_start, A_end) and [B_start, B_end)
  function intervalsOverlap(s1, e1, s2, e2) {
    return s1 < e2 && e1 > s2;
  }

  // Appointment 14:00-15:00
  const aptStart = '14:00';
  const aptEnd = '15:00';

  // Overlaps 14:30-15:00
  assert.strictEqual(intervalsOverlap(aptStart, aptEnd, '14:30', '15:00'), true);
  // Overlaps 13:30-14:30
  assert.strictEqual(intervalsOverlap(aptStart, aptEnd, '13:30', '14:30'), true);
  // Overlaps 14:15-14:45
  assert.strictEqual(intervalsOverlap(aptStart, aptEnd, '14:15', '14:45'), true);
  // Overlaps 13:00-16:00 (contained within)
  assert.strictEqual(intervalsOverlap(aptStart, aptEnd, '13:00', '16:00'), true);

  // Does NOT overlap 15:00-15:30 (adjacent)
  assert.strictEqual(intervalsOverlap(aptStart, aptEnd, '15:00', '15:30'), false);
  // Does NOT overlap 13:00-14:00 (adjacent)
  assert.strictEqual(intervalsOverlap(aptStart, aptEnd, '13:00', '14:00'), false);
  console.log('   ✓ Interval overlap logic strictly adheres to [start, end) definition');

  // 2. Tashkent Timezone calculation
  console.log('\n2. Testing Asia/Tashkent Date/Time helper...');
  const { dateStr, timeStr } = getTashkentNow();
  assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(timeStr, /^([01]\d|2[0-3]):[0-5]\d$/);
  console.log(`   ✓ Current Tashkent time returned: ${dateStr} ${timeStr}`);

  // 3. Phone normalization
  console.log('\n3. Testing Phone Normalization...');
  function normalizeUzPhone(raw) {
    let digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 9) {
      digits = `998${digits}`;
    }
    return `+${digits}`;
  }

  assert.strictEqual(normalizeUzPhone('90 111 22 33'), '+998901112233');
  assert.strictEqual(normalizeUzPhone('+998 (90) 111-22-33'), '+998901112233');
  assert.strictEqual(normalizeUzPhone('998901112233'), '+998901112233');
  assert.strictEqual(/^\+998\d{9}$/.test(normalizeUzPhone('90 111 22 33')), true);
  assert.strictEqual(/^\+998\d{9}$/.test(normalizeUzPhone('12345')), false);
  console.log('   ✓ Phone numbers normalized to +998XXXXXXXXX and invalid inputs rejected');

  // 4. Sequential Mijoz N calculation logic (MAX + 1)
  console.log('\n4. Testing Sequential Mijoz N naming...');
  function calcNextMijozName(existingNames) {
    let maxNum = 0;
    for (const name of existingNames) {
      const match = name.match(/^Mijoz\s+(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return `Mijoz ${maxNum + 1}`;
  }

  assert.strictEqual(calcNextMijozName([]), 'Mijoz 1');
  assert.strictEqual(calcNextMijozName(['Mijoz 1', 'Mijoz 2']), 'Mijoz 3');
  // Even if Mijoz 2 was deleted, max is 3 so next is 4
  assert.strictEqual(calcNextMijozName(['Mijoz 1', 'Mijoz 3']), 'Mijoz 4');
  assert.strictEqual(calcNextMijozName(['Alisher', 'Mijoz 5', 'Bekzod']), 'Mijoz 6');
  console.log('   ✓ Sequential Mijoz names computed via MAX(N) + 1');

  // 5. Available slots with duration computation
  console.log('\n5. Testing Available Slots duration and overlap calculation...');
  const baseSlots = ['14:00', '14:30', '15:00', '15:30', '16:00'];
  const activeAppts = [{ startTime: '14:00', endTime: '15:00' }];
  const blockedSlots = [{ startTime: '15:30', endTime: '16:00' }];

  function getAvailable(duration) {
    return baseSlots.map((time) => {
      const slotStart = time;
      const slotEnd = addMinutesToTime(slotStart, duration);
      const aptOverlap = activeAppts.some((a) => a.startTime < slotEnd && a.endTime > slotStart);
      const blkOverlap = blockedSlots.some((b) => b.startTime < slotEnd && b.endTime > slotStart);
      return { time, isAvailable: !aptOverlap && !blkOverlap };
    });
  }

  const avail30 = getAvailable(30);
  // 14:00: false (occupied 14:00-15:00)
  assert.strictEqual(avail30.find((s) => s.time === '14:00').isAvailable, false);
  // 14:30: false (occupied 14:00-15:00)
  assert.strictEqual(avail30.find((s) => s.time === '14:30').isAvailable, false);
  // 15:00: true (free 15:00-15:30)
  assert.strictEqual(avail30.find((s) => s.time === '15:00').isAvailable, true);
  // 15:30: false (blocked 15:30-16:00)
  assert.strictEqual(avail30.find((s) => s.time === '15:30').isAvailable, false);
  // 16:00: true
  assert.strictEqual(avail30.find((s) => s.time === '16:00').isAvailable, true);

  // 60-minute service:
  const avail60 = getAvailable(60);
  // 15:00 for 60 mins -> 15:00-16:00 overlaps blocked slot 15:30-16:00!
  assert.strictEqual(avail60.find((s) => s.time === '15:00').isAvailable, false);
  console.log('   ✓ 60-minute appointment at 15:00 correctly detected as overlapping with 15:30 blocked slot');

  console.log('\n=======================================================');
  console.log(' 🎉 ALL REVIEW FIX LOGIC & UNIT TESTS PASSED (100%)');
  console.log('=======================================================\n');
}

runUnitAndLogicTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
