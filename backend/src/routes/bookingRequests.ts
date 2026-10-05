import { Router, Request, Response } from 'express';
import { db, BookingRequest, Appointment } from '../db';
import { pushService } from '../pushService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

// GET /booking-requests - List of booking requests for logged-in master (auto-expires stale requests)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const masterId = req.user!.userId;

    // Check & expire stale pending requests automatically on every query (Section 1 & 9)
    await db.expirePendingBookingRequests(config.requestTtlMinutes || 30);

    const requests = await db.getBookingRequests(masterId);

    res.json({
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('[BookingRequests GET error]:', error);
    res.status(500).json({ error: 'Soʻrovlarni yuklashda xatolik yuz berdi' });
  }
});

// In-memory rate limiting map: ip -> { count, resetAt }, phone -> { count, resetAt }
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();
const phoneRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, phone: string): boolean {
  const now = Date.now();

  // IP limit: 5 req per minute
  const ipEntry = ipRateLimits.get(ip);
  if (ipEntry && ipEntry.resetAt > now) {
    if (ipEntry.count >= 5) return false;
    ipEntry.count++;
  } else {
    ipRateLimits.set(ip, { count: 1, resetAt: now + 60 * 1000 });
  }

  // Phone limit: 3 req per hour
  const phoneEntry = phoneRateLimits.get(phone);
  if (phoneEntry && phoneEntry.resetAt > now) {
    if (phoneEntry.count >= 3) return false;
    phoneEntry.count++;
  } else {
    phoneRateLimits.set(phone, { count: 1, resetAt: now + 3600 * 1000 });
  }

  return true;
}

// POST /booking-requests - Client submits request from public booking page
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check & expire stale requests
    await db.expirePendingBookingRequests(config.requestTtlMinutes || 30);

    const { masterId, clientName, clientPhone, serviceId, date, time } = req.body;

    if (!masterId || !clientName || !clientPhone || !serviceId || !date || !time) {
      res.status(400).json({ error: "Barcha maydonlarni to'ldirish shart (masterId, clientName, clientPhone, serviceId, date, time)" });
      return;
    }

    const trimmedName = String(clientName).trim();
    if (trimmedName.length < 2) {
      res.status(400).json({ error: "Mijoz ismi kamida 2 ta harfdan iborat bo'lishi kerak" });
      return;
    }

    // Phone validation
    let cleanPhone = String(clientPhone).replace(/\D/g, '');
    if (cleanPhone.length === 9) cleanPhone = `998${cleanPhone}`;
    if (!/^998\d{9}$/.test(cleanPhone)) {
      res.status(400).json({ error: "Telefon raqami noto'g'ri. +998XXXXXXXXX formatida kiriting" });
      return;
    }
    const formattedPhone = `+${cleanPhone}`;

    // Date validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      res.status(400).json({ error: "Sana formati noto'g'ri (YYYY-MM-DD)" });
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (String(date) < today) {
      res.status(400).json({ error: "O'tgan sanaga yozilish mumkin emas" });
      return;
    }

    // Time validation
    if (!/^\d{2}:\d{2}$/.test(String(time))) {
      res.status(400).json({ error: "Vaqt formati noto'g'ri (HH:MM)" });
      return;
    }
    const [hours, mins] = String(time).split(':').map(Number);
    if (hours < 7 || hours > 23 || mins < 0 || mins > 59) {
      res.status(400).json({ error: "Kiritilgan vaqt ish vaqtidan tashqarida (07:00 - 23:00)" });
      return;
    }

    // Rate limit check
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(String(clientIp), formattedPhone)) {
      res.status(429).json({ error: "Juda ko'p so'rov yuborildi. Iltimos, birozdan so'ng qayta urinib ko'ring" });
      return;
    }

    // Verify master existence
    let master = await db.getUserById(masterId);
    if (!master) {
      master = await db.getUserByUsername(masterId);
    }
    if (!master) {
      res.status(404).json({ error: "Usta topilmadi" });
      return;
    }

    // Verify service existence & ownership
    const service = await db.getServiceById(serviceId);
    if (!service || service.userId !== master.id) {
      res.status(404).json({ error: "Tanlangan xizmat topilmadi yoki ustaga tegishli emas" });
      return;
    }

    // Check slot availability
    if (await db.hasActiveSlotConflict(master.id, String(date), String(time))) {
      res.status(409).json({ error: "Ushbu vaqt oralig'ida allaqachon boshqa qabul mavjud" });
      return;
    }

    const newRequest: BookingRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      masterId: master.id,
      clientName: trimmedName,
      clientPhone: formattedPhone,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      badgeColor: service.badgeColor || '#2563EB',
      date: String(date),
      time: String(time),
      duration: service.duration || 30,
      status: 'pending',
    };

    const savedRequest = await db.createBookingRequest(newRequest);

    // Add entry to call log for master
    await db.addCallLog(master.id, formattedPhone, trimmedName, 'booking_request').catch(() => {});

    // Create in-app notification
    await db.createNotification({
      userId: master.id,
      type: 'booking_request',
      title: `Yangi so'rov: ${savedRequest.clientName}`,
      body: `${savedRequest.serviceName} • ${date}, soat ${time}`,
      data: { requestId: savedRequest.id },
    }).catch(() => {});

    // Send Web Push Notification to master
    try {
      await pushService.sendNotificationToUser(master.id, {
        title: `Yangi so'rov: ${savedRequest.clientName}`,
        body: `${savedRequest.serviceName} • ${date}, soat ${time}`,
        tag: `booking-request-${savedRequest.id}`,
        data: {
          screen: 'bookingRequests',
          url: '/',
          requestId: savedRequest.id,
        },
      });
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: "So'rov muvaffaqiyatli yuborildi!",
      request: savedRequest,
    });
  } catch (error) {
    console.error('[BookingRequests POST error]:', error);
    res.status(500).json({ error: "So'rovni yuborishda xatolik yuz berdi" });
  }
});

// POST /booking-requests/:id/accept - Master accepts request -> creates appointment in schedule
router.post('/:id/accept', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const masterId = req.user!.userId;
    const { id } = req.params;
    const request = await db.getBookingRequestById(id);

    if (!request || request.masterId !== masterId) {
      res.status(404).json({ error: "So'rov topilmadi yoki ruxsat berilmagan" });
      return;
    }

    // Check double booking
    if (await db.hasActiveSlotConflict(masterId, request.date, request.time)) {
      res.status(409).json({ error: "Ushbu vaqt oralig'ida allaqachon boshqa qabul mavjud" });
      return;
    }

    await db.updateBookingRequestStatus(id, 'accepted');

    // Calculate end time
    const [h, m] = request.time.split(':').map(Number);
    const totalM = (h || 9) * 60 + (m || 0) + (request.duration || 30);
    const endTime = `${String(Math.floor(totalM / 60) % 24).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;

    const client = await db.createOrUpdateClient(masterId, request.clientName, request.clientPhone, request.servicePrice);

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: masterId,
      clientId: client?.id,
      clientName: request.clientName,
      clientPhone: request.clientPhone,
      serviceId: request.serviceId,
      serviceName: request.serviceName,
      servicePrice: request.servicePrice,
      badgeColor: request.badgeColor || '#2563EB',
      date: request.date,
      startTime: request.time,
      endTime,
      duration: request.duration || 30,
      status: 'confirmed',
    };

    await db.createAppointment(newAppointment);

    // If client is a registered user, send push
    const clientUser = await db.getUserByPhone(request.clientPhone);
    if (clientUser) {
      await db.createNotification({
        userId: clientUser.id,
        type: 'booking_accepted',
        title: 'Qabulingiz tasdiqlandi! 🎉',
        body: `${request.date} soat ${request.time} ga yozuv tasdiqlandi.`,
        data: { appointmentId: newAppointment.id },
      }).catch(() => {});

      try {
        await pushService.sendNotificationToUser(clientUser.id, {
          title: 'Qabulingiz tasdiqlandi! 🎉',
          body: `${request.date} soat ${request.time} ga yozuv tasdiqlandi.`,
          data: { screen: 'myAppointments', url: '/yozuvlarim' },
        });
      } catch (_) {}
    }

    res.json({
      success: true,
      message: "So'rov tasdiqlandi va jadvalga qo'shildi",
      appointment: newAppointment,
    });
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.code === 'SLOT_OCCUPIED') {
      res.status(409).json({ error: "Ushbu vaqt oralig'ida allaqachon boshqa qabul mavjud" });
      return;
    }
    console.error('[BookingRequests accept error]:', error);
    res.status(500).json({ error: "So'rovni qabul qilishda xatolik yuz berdi" });
  }
});

// POST /booking-requests/:id/reject - Master rejects request
router.post('/:id/reject', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const masterId = req.user!.userId;
    const { id } = req.params;
    const request = await db.getBookingRequestById(id);

    if (!request || request.masterId !== masterId) {
      res.status(404).json({ error: "So'rov topilmadi yoki ruxsat berilmagan" });
      return;
    }

    await db.updateBookingRequestStatus(id, 'rejected');

    // If client is a registered user, send push & in-app notification
    const clientUser = await db.getUserByPhone(request.clientPhone);
    if (clientUser) {
      await db.createNotification({
        userId: clientUser.id,
        type: 'booking_rejected',
        title: "So'rovingiz rad etildi",
        body: `${request.date} soat ${request.time} dagi vaqt band yoki bekor qilindi.`,
        data: { requestId: id },
      }).catch(() => {});

      try {
        await pushService.sendNotificationToUser(clientUser.id, {
          title: "So'rovingiz rad etildi",
          body: `${request.date} soat ${request.time} dagi vaqt band yoki bekor qilindi.`,
          data: { screen: 'myAppointments', url: '/yozuvlarim' },
        });
      } catch (_) {}
    }

    res.json({
      success: true,
      message: "So'rov rad etildi",
    });
  } catch (error) {
    console.error('[BookingRequests reject error]:', error);
    res.status(500).json({ error: "So'rovni rad etishda xatolik yuz berdi" });
  }
});

export default router;
