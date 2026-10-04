import { Router, Request, Response } from 'express';
import { db, BookingRequest, Appointment } from '../db';
import { pushService } from '../pushService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /booking-requests - List of booking requests for logged-in master
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const masterId = req.user!.userId;
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

// POST /booking-requests - Client submits request from public booking page
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { masterId, clientName, clientPhone, serviceId, date, time } = req.body;

    if (!clientName || !clientPhone || !serviceId || !date || !time) {
      res.status(400).json({ error: "Barcha maydonlarni to'ldirish shart" });
      return;
    }

    const targetMasterId = masterId || 'u-1';
    const service = (await db.getServiceById(serviceId)) || {
      id: serviceId || 'srv-1',
      name: 'Soch turmagi',
      price: 50000,
      badgeColor: '#A67C2E',
      duration: 30,
    };

    const newRequest: BookingRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      masterId: targetMasterId,
      clientName: String(clientName).trim(),
      clientPhone: String(clientPhone).trim(),
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      badgeColor: service.badgeColor || '#A67C2E',
      date,
      time,
      duration: service.duration || 30,
      status: 'pending',
    };

    const savedRequest = await db.createBookingRequest(newRequest);

    // Send real Push Notification to master
    try {
      await pushService.sendNotificationToUser(targetMasterId, {
        title: `Yangi so'rov: ${savedRequest.clientName}`,
        body: `${savedRequest.serviceName} • ${date}, soat ${time}`,
        tag: `booking-request-${savedRequest.id}`,
        data: {
          screen: 'bookingRequests',
          url: '/',
          requestId: savedRequest.id,
        },
      });
    } catch (pushErr) {
      console.error('[BookingRequests] Push notification error:', pushErr);
    }

    res.status(201).json({
      success: true,
      message: "So'rov muvaffaqiyatli yuborildi!",
      request: savedRequest,
    });
  } catch (error) {
    console.error('[BookingRequests POST error]:', error);
    res.status(500).json({ error: 'Soʻrovni yuborishda xatolik yuz berdi' });
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
      clientId: client.id,
      clientName: request.clientName,
      clientPhone: request.clientPhone,
      serviceId: request.serviceId,
      serviceName: request.serviceName,
      servicePrice: request.servicePrice,
      badgeColor: request.badgeColor || '#A67C2E',
      date: request.date,
      startTime: request.time,
      endTime,
      duration: request.duration || 30,
      status: 'confirmed',
    };

    await db.createAppointment(newAppointment);

    res.json({
      success: true,
      message: "So'rov qabul qilindi va jadvalga qo'shildi",
      appointment: newAppointment,
    });
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.code === 'SLOT_OCCUPIED') {
      res.status(409).json({ error: "Ushbu vaqt oralig'ida allaqachon boshqa qabul mavjud" });
      return;
    }
    console.error('[BookingRequests accept POST error]:', error);
    res.status(500).json({ error: 'Soʻrovni qabul qilishda xatolik yuz berdi' });
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

    res.json({
      success: true,
      message: "So'rov rad etildi",
    });
  } catch (error) {
    console.error('[BookingRequests reject POST error]:', error);
    res.status(500).json({ error: 'Soʻrovni rad etishda xatolik yuz berdi' });
  }
});

export default router;
