const { normalizeUzbekPhone, addMinutesToTime, getTashkentNow } = require('./backend/dist/db');

function runUnitTests() {
  console.log('=== BARBERO FOUNDER REDESIGN UNIT TESTS ===\n');

  // Test 1: Phone Normalization
  console.log('1. Testing Phone Normalization:');
  const phones = [
    { input: '+998 90 123 45 67', expected: '+998901234567' },
    { input: '90 123 45 67', expected: '+998901234567' },
    { input: '998901234567', expected: '+998901234567' },
    { input: '90-123-45-67', expected: '+998901234567' },
    { input: '+998901234567', expected: '+998901234567' },
    { input: '91 999 88 77', expected: '+998919998877' },
  ];

  for (const { input, expected } of phones) {
    const res = normalizeUzbekPhone(input);
    if (res !== expected) {
      throw new Error(`Phone normalization failed for "${input}": expected "${expected}", got "${res}"`);
    }
  }
  console.log('   ✓ All 6 Uzbek phone formats normalized to standard +998XXXXXXXXX\n');

  // Test 2: Time Addition
  console.log('2. Testing addMinutesToTime:');
  const times = [
    { start: '14:00', duration: 30, expected: '14:30' },
    { start: '14:30', duration: 45, expected: '15:15' },
    { start: '20:45', duration: 30, expected: '21:15' },
  ];

  for (const { start, duration, expected } of times) {
    const res = addMinutesToTime(start, duration);
    if (res !== expected) {
      throw new Error(`Time addition failed for ${start} + ${duration}m: expected ${expected}, got ${res}`);
    }
  }
  console.log('   ✓ Slot duration and end-time calculation verified\n');

  // Test 3: Overlap Logic
  console.log('3. Testing Interval Overlap Condition [A_start, A_end) vs [B_start, B_end):');
  function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && aEnd > bStart;
  }

  // Interval [15:00, 15:30)
  if (!intervalsOverlap('15:00', '15:30', '15:00', '15:30')) throw new Error('Identical slots should conflict');
  if (!intervalsOverlap('15:00', '15:30', '15:15', '15:45')) throw new Error('Partial overlap should conflict');
  if (!intervalsOverlap('15:00', '15:30', '14:45', '15:15')) throw new Error('Leading overlap should conflict');
  if (intervalsOverlap('15:00', '15:30', '15:30', '16:00')) throw new Error('Adjacent adjacent slot 15:30-16:00 should NOT conflict');
  if (intervalsOverlap('15:00', '15:30', '14:30', '15:00')) throw new Error('Prior adjacent slot 14:30-15:00 should NOT conflict');

  console.log('   ✓ Precise slot overlap and non-blocking adjacent boundary verified\n');

  // Test 4: Tashkent Timezone calculation
  console.log('4. Testing Asia/Tashkent Timezone helper:');
  const now = getTashkentNow();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(now.dateStr) || !/^\d{2}:\d{2}$/.test(now.timeStr)) {
    throw new Error(`Invalid Tashkent time structure: ${JSON.stringify(now)}`);
  }
  console.log(`   ✓ Current Tashkent date: ${now.dateStr}, time: ${now.timeStr}\n`);

  console.log('========================================================');
  console.log(' ALL BARBERO REDESIGN UNIT TESTS PASSED (100%)');
  console.log('========================================================\n');
}

runUnitTests();
