import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// Helper to format date in Asia/Tashkent
function getTashkentDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // YYYY-MM-DD
}

function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function addDays(dateStr: string, days: number): string {
  const d = parseYMD(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function getDaysDiff(fromStr: string, toStr: string): number {
  const from = parseYMD(fromStr);
  const to = parseYMD(toStr);
  const diffTime = to.getTime() - from.getTime();
  return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24))) + 1;
}

// Format integer with space separators: e.g. 1 190 000 uzs
export function formatUzs(amount: number): string {
  const rounded = Math.round(amount);
  const str = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${str} uzs`;
}

// GET /analytics?period=hafta|oy|yil&from=YYYY-MM-DD&to=YYYY-MM-DD&group=day|month
router.get('/', (req: Request, res: Response): void => {
  const period = (req.query.period as 'hafta' | 'oy' | 'yil' | 'custom') || 'oy';
  let from = req.query.from as string;
  let to = req.query.to as string;
  const masterId = (req.query.masterId as string) || 'u-1';
  const group = (req.query.group as 'day' | 'month') || (period === 'yil' ? 'month' : 'day');

  const todayStr = getTashkentDateString(new Date());
  const todayDate = parseYMD(todayStr);

  if (!from || !to) {
    if (period === 'hafta') {
      // Current week Monday..Sunday
      const dayOfWeek = todayDate.getUTCDay(); // 0 is Sun, 1 is Mon...
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      from = addDays(todayStr, diffToMon);
      to = addDays(from, 6);
    } else if (period === 'yil') {
      // Current year Jan 1..Dec 31
      const year = todayDate.getUTCFullYear();
      from = `${year}-01-01`;
      to = `${year}-12-31`;
    } else {
      // Default: Current month 1st..end of month
      const year = todayDate.getUTCFullYear();
      const month = String(todayDate.getUTCMonth() + 1).padStart(2, '0');
      from = `${year}-${month}-01`;
      const lastDay = new Date(Date.UTC(year, todayDate.getUTCMonth() + 1, 0)).getUTCDate();
      to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    }
  }

  // Validate dates
  if (from > to) {
    res.status(400).json({
      error: "Boshlanish sanasi tugashdan keyin bo'lishi mumkin emas",
    });
    return;
  }

  const periodLength = getDaysDiff(from, to);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(periodLength - 1));

  // Master's appointments (only 'confirmed' or 'completed')
  const allMasterAppointments = db.appointments.filter(
    (a) => a.userId === masterId && (a.status === 'confirmed' || a.status === 'completed')
  );

  // Current period appointments
  const currentAppointments = allMasterAppointments.filter(
    (a) => a.date >= from && a.date <= to
  );

  // Previous period appointments for growth comparison
  const prevAppointments = allMasterAppointments.filter(
    (a) => a.date >= prevFrom && a.date <= prevTo
  );

  // 1. Daromad (Revenue)
  const totalRevenue = currentAppointments.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
  const totalBookings = currentAppointments.length;
  const avgPayment = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  const prevRevenue = prevAppointments.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
  let growthRate = '0%';
  if (prevRevenue === 0) {
    growthRate = totalRevenue > 0 ? 'Yangi' : '0%';
  } else {
    const rate = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
    growthRate = `${rate >= 0 ? '+' : ''}${rate}%`;
  }

  const revenueTitle =
    period === 'hafta'
      ? 'Haftalik daromad'
      : period === 'yil'
      ? 'Yillik daromad'
      : period === 'oy'
      ? 'Oylik daromad'
      : 'Daromad';

  // 2. Mijozlar (Clients)
  const clientPhones = new Set(
    currentAppointments.map((a) => a.clientPhone || a.clientName || a.clientId)
  );
  const uniqueClientsCount = clientPhones.size;

  // New clients whose very first booking EVER with this master is in this period
  let newClientsCount = 0;
  clientPhones.forEach((phoneKey) => {
    const allForClient = allMasterAppointments.filter(
      (a) => (a.clientPhone || a.clientName || a.clientId) === phoneKey
    );
    allForClient.sort((a, b) => a.date.localeCompare(b.date));
    if (allForClient.length > 0 && allForClient[0].date >= from && allForClient[0].date <= to) {
      newClientsCount += 1;
    }
  });

  // 3. Bandlik (Occupancy)
  // Days in current period with at least 1 booking
  const bookedDays = new Set(currentAppointments.map((a) => a.date)).size;

  // Calculate master's total working days in this period according to workingHours schedule
  const workingDayIndexes = new Set(
    db.workingHours.filter((w) => w.isWorking).map((w) => (w.dayIndex === 7 ? 0 : w.dayIndex))
  );

  let totalWorkingDaysInPeriod = 0;
  let cur = from;
  while (cur <= to) {
    const curDay = parseYMD(cur).getUTCDay();
    if (workingDayIndexes.has(curDay)) {
      totalWorkingDaysInPeriod += 1;
    }
    cur = addDays(cur, 1);
  }

  // Avoid division by zero
  const occupancyM = totalWorkingDaysInPeriod > 0 ? totalWorkingDaysInPeriod : periodLength;
  const occupancyPercent = occupancyM > 0 ? Math.min(100, Math.round((bookedDays / occupancyM) * 100)) : 0;

  // 4. Tushum dinamikasi (Dynamics Chart)
  let chartData: Array<{ label: string; month?: string; amount: number; heightPercent: number; isCurrent?: boolean }> = [];

  if (period === 'hafta') {
    // 7 days of week: Dush, Sesh, Chor, Pay, Juma, Shan, Yak
    const daysUz = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'];
    let iter = from;
    for (let i = 0; i < 7; i++) {
      const dayAppointments = currentAppointments.filter((a) => a.date === iter);
      const daySum = dayAppointments.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
      chartData.push({
        label: daysUz[i],
        month: daysUz[i],
        amount: daySum,
        heightPercent: 0,
        isCurrent: iter === todayStr,
      });
      iter = addDays(iter, 1);
    }
  } else if (period === 'yil') {
    // 12 months
    const monthsUz = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const currentYear = parseYMD(from).getUTCFullYear();
    const currentMonthIdx = todayDate.getUTCMonth();

    for (let m = 1; m <= 12; m++) {
      const monthPrefix = `${currentYear}-${String(m).padStart(2, '0')}`;
      const monthAppointments = currentAppointments.filter((a) => a.date.startsWith(monthPrefix));
      const monthSum = monthAppointments.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
      chartData.push({
        label: monthsUz[m - 1],
        month: monthsUz[m - 1],
        amount: monthSum,
        heightPercent: 0,
        isCurrent: m - 1 === currentMonthIdx,
      });
    }
  } else {
    // Month or custom range: group by day if <= 31 days
    if (periodLength <= 31) {
      let iter = from;
      while (iter <= to) {
        const dayAppointments = currentAppointments.filter((a) => a.date === iter);
        const daySum = dayAppointments.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
        const dayNum = String(parseYMD(iter).getUTCDate());
        chartData.push({
          label: dayNum,
          month: dayNum,
          amount: daySum,
          heightPercent: 0,
          isCurrent: iter === todayStr,
        });
        iter = addDays(iter, 1);
      }
    } else {
      // Group by months
      const monthsUz = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
      for (let m = 0; m < 12; m++) {
        const monthNum = String(m + 1).padStart(2, '0');
        const monthAppointments = currentAppointments.filter((a) => a.date.includes(`-${monthNum}-`));
        const monthSum = monthAppointments.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
        chartData.push({
          label: monthsUz[m],
          month: monthsUz[m],
          amount: monthSum,
          heightPercent: 0,
        });
      }
    }
  }

  // Calculate dynamic bar heights
  const maxAmount = Math.max(...chartData.map((d) => d.amount), 0);
  chartData = chartData.map((d) => ({
    ...d,
    heightPercent:
      maxAmount > 0
        ? d.amount > 0
          ? Math.max(12, Math.round((d.amount / maxAmount) * 100))
          : 6
        : 6,
  }));

  res.json({
    period,
    from,
    to,
    revenue: {
      total: totalRevenue,
      formatted: formatUzs(totalRevenue),
      amountFormatted: formatUzs(totalRevenue),
      totalBookings,
      avgPayment,
      growthRate,
      title: revenueTitle,
      subtitle: `${totalBookings} ta yozuv, o'rtacha to'lov ${formatUzs(avgPayment)}`,
    },
    metrics: {
      clients: {
        total: uniqueClientsCount,
        count: uniqueClientsCount,
        countFormatted: `${uniqueClientsCount}`,
        growth: `+${newClientsCount} yangi mijoz`,
        newClients: newClientsCount,
      },
      occupancy: {
        percent: occupancyPercent,
        percentFormatted: `${occupancyPercent}%`,
        ratio: `${bookedDays}/${occupancyM} kun`,
        ratioText: `${bookedDays}/${occupancyM} kun`,
        bookedDays,
        workingDays: occupancyM,
      },
    },
    dynamics: {
      title: 'Tushum dinamikasi',
      subtitle: period === 'yil' ? "Oylar bo'yicha" : period === 'hafta' ? "Hafta kunlari bo'yicha" : "Kunlar bo'yicha",
      badge: growthRate,
      group: group || (period === 'yil' ? 'month' : 'day'),
      chart: chartData,
    },
  });
});

export default router;
