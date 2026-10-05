import { Router, Request, Response } from 'express';
import { db, Appointment, addMinutesToTime, getTashkentNow } from '../db';

const router = Router();

// In-memory rate-limit trackers for public booking endpoints
const ipRequestHistory = new Map<string, number[]>();
const phoneRequestHistory = new Map<string, number[]>();

function checkRateLimit(ip: string, phone: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  // Check IP limit: max 5 requests per minute
  const ipTimestamps = (ipRequestHistory.get(ip) || []).filter((t) => t > oneMinuteAgo);
  if (ipTimestamps.length >= 5) {
    return {
      allowed: false,
      message: "Juda ko'p so'rov yuborildi. Iltimos, 1 daqiqa kutib qayta urinib ko'ring (IP limit: 5/daq)",
    };
  }
  ipTimestamps.push(now);
  ipRequestHistory.set(ip, ipTimestamps);

  // Check phone limit: max 3 requests per hour
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone) {
    const phoneTimestamps = (phoneRequestHistory.get(cleanPhone) || []).filter((t) => t > oneHourAgo);
    if (phoneTimestamps.length >= 3) {
      return {
        allowed: false,
        message: "Ushbu raqam orqali juda ko'p ariza yuborilgan. Iltimos, 1 soatdan so'ng urinib ko'ring (Limit: 3/soat)",
      };
    }
    phoneTimestamps.push(now);
    phoneRequestHistory.set(cleanPhone, phoneTimestamps);
  }

  return { allowed: true };
}

// Helper to normalize and validate Uzbekistan phone
export function normalizePhone(raw: string): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 9) {
    digits = `998${digits}`;
  }
  return `+${digits}`;
}

// GET /public/b/:username - Info for public booking page
router.get('/b/:username', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    let master = await db.getUserByUsername(username);
    if (!master) {
      master = await db.getUserById(username);
    }

    if (!master) {
      res.status(404).json({ error: 'Usta topilmadi' });
      return;
    }

    let allServices = await db.getServices(master.id);
    if (!allServices || allServices.length === 0) {
      const defaultStarterServices = [
        { name: 'Soch olish', price: 50000, duration: 30, badgeColor: '#2563EB', isActive: true },
        { name: 'Soch + soqol', price: 70000, duration: 45, badgeColor: '#2563EB', isActive: true },
        { name: 'Bolalar sochi', price: 30000, duration: 25, badgeColor: '#10B981', isActive: true },
        { name: 'Soqol olish', price: 30000, duration: 20, badgeColor: '#F59E0B', isActive: true },
        { name: 'Kreativ soqol tekislash', price: 45000, duration: 30, badgeColor: '#8B5CF6', isActive: true },
      ];
      for (let i = 0; i < defaultStarterServices.length; i++) {
        const item = defaultStarterServices[i];
        await db.createService({
          id: `srv-${Date.now()}-${i + 1}`,
          userId: master.id,
          name: item.name,
          price: item.price,
          duration: item.duration,
          badgeColor: item.badgeColor,
          isActive: item.isActive,
        });
      }
      allServices = await db.getServices(master.id);
    }

    const activeServices = allServices.filter((s) => s.isActive);
    const workingSchedule = await db.getWorkingHours(master.id);
    const photos = await db.getPortfolioPhotos(master.id);
    const settings = await db.getUserSettings(master.id);

    res.json({
      master: {
        id: master.id,
        name: master.fullName,
        username: master.username,
        avatarUrl: master.avatarUrl,
        bio: master.bio,
        workingDays: 'Dush – Shan 09:00 – 21:00',
        bookingWindowDays: 14,
      },
      services: activeServices,
      workingHours: workingSchedule,
      portfolio: photos,
      settings: {
        bookingLinkActive: settings.bookingLinkActive,
        allowCustomTimeRequest: settings.allowCustomTimeRequest,
        allowLunchTimeBooking: settings.allowLunchTimeBooking,
      },
    });
  } catch (error) {
    console.error('[PublicBooking GET error]:', error);
    res.status(500).json({ error: 'Usta maʼlumotlarini yuklashda xatolik yuz berdi' });
  }
});

// GET /public/b/:username/available-slots?date=YYYY-MM-DD&duration=30
router.get('/b/:username/available-slots', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    let master = await db.getUserByUsername(username);
    if (!master) {
      master = await db.getUserById(username);
    }

    if (!master) {
      res.status(404).json({ error: 'Usta topilmadi' });
      return;
    }

    const { date, duration: reqDuration } = req.query;
    const { dateStr: todayStr, timeStr: nowTimeStr } = getTashkentNow();
    const targetDate = (date as string) || todayStr;
    const duration = Math.max(15, Math.min(180, Number(reqDuration) || 30));

    // Base working slots (09:00 - 21:00)
    const baseSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
      '19:00', '19:30', '20:00', '20:30',
    ];

    const appointments = await db.getAppointments(master.id, targetDate);
    const activeAppts = appointments.filter((a) => a.status !== 'cancelled');
    const blockedSlots = await db.getBlockedSlots(master.id, targetDate);

    const slots = baseSlots.map((time) => {
      const slotStart = time;
      const slotEnd = addMinutesToTime(slotStart, duration);

      // Check if slot is in the past
      if (targetDate < todayStr || (targetDate === todayStr && slotStart < nowTimeStr)) {
        return { time, isAvailable: false };
      }

      // Check interval collision with appointments [start, end)
      const aptOverlap = activeAppts.some((a) => a.startTime < slotEnd && a.endTime > slotStart);
      if (aptOverlap) {
        return { time, isAvailable: false };
      }

      // Check interval collision with blocked slots [start, end)
      const blkOverlap = blockedSlots.some((b) => b.startTime < slotEnd && b.endTime > slotStart);
      if (blkOverlap) {
        return { time, isAvailable: false };
      }

      return { time, isAvailable: true };
    });

    res.json({ date: targetDate, duration, slots });
  } catch (error) {
    console.error('[PublicBooking slots GET error]:', error);
    res.status(500).json({ error: 'Boʻsh vaqtlarni yuklashda xatolik yuz berdi' });
  }
});

// POST /public/b/:username/book - Submit booking from client
router.post('/b/:username/book', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const { username } = req.params;
    let master = await db.getUserByUsername(username);
    if (!master) {
      master = await db.getUserById(username);
    }

    if (!master) {
      res.status(404).json({ error: 'Usta topilmadi' });
      return;
    }

    const { clientName, clientPhone, serviceId, date, startTime } = req.body;

    if (!clientName || !clientPhone || !serviceId || !date || !startTime) {
      res.status(400).json({ error: "Barcha maydonlarni to'ldirish shart" });
      return;
    }

    // Strict phone validation (+998XXXXXXXXX)
    const normalizedPhone = normalizePhone(clientPhone);
    if (!/^\+998\d{9}$/.test(normalizedPhone)) {
      res.status(400).json({ error: "Telefon raqami noto'g'ri. +998XXXXXXXXX formatida kiriting (masalan, +998901234567)" });
      return;
    }

    // Rate limiting
    const rateCheck = checkRateLimit(clientIp, normalizedPhone);
    if (!rateCheck.allowed) {
      res.status(429).json({ error: rateCheck.message });
      return;
    }

    // Strict date format (YYYY-MM-DD) and not in past
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "Sana formati noto'g'ri (YYYY-MM-DD)" });
      return;
    }

    // Strict time format (HH:MM)
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      res.status(400).json({ error: "Vaqt formati noto'g'ri (HH:MM)" });
      return;
    }

    const { dateStr: todayStr, timeStr: nowTimeStr } = getTashkentNow();
    if (date < todayStr || (date === todayStr && startTime < nowTimeStr)) {
      res.status(400).json({ error: "O'tib ketgan sanaga yozilish mumkin emas" });
      return;
    }

    // Verify service belongs to this master and resolve authoritative duration & price
    const service = await db.getServiceById(serviceId);
    if (!service || service.userId !== master.id) {
      res.status(404).json({ error: "Tanlangan xizmat ushbu ustaga tegishli emas yoki topilmadi" });
      return;
    }

    const duration = service.duration || 30;
    const endTime = addMinutesToTime(startTime, duration);

    // Check if slot interval is already occupied
    if (await db.hasActiveSlotConflict(master.id, date, startTime, endTime)) {
      res.status(409).json({ error: 'Bu vaqt oralig‘i allaqachon band qilingan' });
      return;
    }

    const cleanClientName = String(clientName).trim().slice(0, 100);
    const client = await db.createOrUpdateClient(master.id, cleanClientName, normalizedPhone, service.price);

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: master.id,
      clientId: client.id,
      clientName: cleanClientName,
      clientPhone: normalizedPhone,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      badgeColor: service.badgeColor || '#2563EB',
      date,
      startTime,
      endTime,
      duration,
      status: 'confirmed',
    };

    await db.createAppointment(newAppointment);

    res.status(201).json({
      success: true,
      message: 'Bandlik muvaffaqiyatli saqlandi!',
      appointment: newAppointment,
    });
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.code === 'SLOT_OCCUPIED') {
      res.status(409).json({ error: 'Bu vaqt oralig‘i allaqachon band qilingan' });
      return;
    }
    console.error('[PublicBooking book POST error]:', error);
    res.status(500).json({ error: 'Bandlikni saqlashda xatolik yuz berdi' });
  }
});

export default router;
