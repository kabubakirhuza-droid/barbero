import { Router, Request, Response } from 'express';
import { db, BookingRequest, Appointment } from '../db';
import { pushService } from '../pushService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /booking-requests - List of booking requests for logged-in master
router.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  const masterId = req.user!.userId;
  const requests = db.bookingRequests
    .filter((r) => r.masterId === masterId && r.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    requests,
    count: requests.length,
  });
});

// POST /booking-requests - Client submits request from public booking page
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { masterId, clientName, clientPhone, serviceId, date, time } = req.body;

  if (!clientName || !clientPhone || !serviceId || !date || !time) {
    res.status(400).json({ error: "Barcha maydonlarni to'ldirish shart" });
    return;
  }

  const targetMasterId = masterId || 'u-1';
  const service = db.services.find((s) => s.id === serviceId) || db.services[0];

  const newRequest: BookingRequest = {
    id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    masterId: targetMasterId,
    clientName: String(clientName).trim(),
    clientPhone: String(clientPhone).trim(),
    serviceId: service?.id || 'srv-1',
    serviceName: service?.name || 'Soch turmagi',
    servicePrice: service?.price || 50000,
    badgeColor: service?.badgeColor || '#A67C2E',
    date,
    time,
    duration: service?.duration || 30,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.bookingRequests.unshift(newRequest);

  // Send real Push Notification to master
  try {
    await pushService.sendNotificationToUser(targetMasterId, {
      title: `Yangi so'rov: ${newRequest.clientName}`,
      body: `${newRequest.serviceName} • ${date}, soat ${time}`,
      tag: `booking-request-${newRequest.id}`,
      data: {
        screen: 'bookingRequests',
        url: '/',
        requestId: newRequest.id,
      },
    });
  } catch (pushErr) {
    console.error('[BookingRequests] Push notification error:', pushErr);
  }

  res.status(201).json({
    success: true,
    message: "So'rov muvaffaqiyatli yuborildi!",
    request: newRequest,
  });
});

// POST /booking-requests/:id/accept - Master accepts request -> creates appointment in schedule
router.post('/:id/accept', authenticateToken, (req: AuthRequest, res: Response): void => {
  const masterId = req.user!.userId;
  const { id } = req.params;
  const request = db.bookingRequests.find((r) => r.id === id && r.masterId === masterId);

  if (!request) {
    res.status(404).json({ error: "So'rov topilmadi yoki ruxsat berilmagan" });
    return;
  }

  // Check double booking
  if (db.hasActiveSlotConflict(masterId, request.date, request.time)) {
    res.status(409).json({ error: "Ushbu vaqt oralig'ida allaqachon boshqa qabul mavjud" });
    return;
  }

  request.status = 'accepted';

  // Calculate end time
  const [h, m] = request.time.split(':').map(Number);
  const totalM = (h || 9) * 60 + (m || 0) + (request.duration || 30);
  const endTime = `${String(Math.floor(totalM / 60) % 24).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;

  const client = db.createOrUpdateClient(masterId, request.clientName, request.clientPhone, request.servicePrice);

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

  db.createAppointment(newAppointment);

  res.json({
    success: true,
    message: "So'rov qabul qilindi va jadvalga qo'shildi",
    appointment: newAppointment,
  });
});

// POST /booking-requests/:id/reject - Master rejects request
router.post('/:id/reject', authenticateToken, (req: AuthRequest, res: Response): void => {
  const masterId = req.user!.userId;
  const { id } = req.params;
  const request = db.bookingRequests.find((r) => r.id === id && r.masterId === masterId);

  if (!request) {
    res.status(404).json({ error: "So'rov topilmadi yoki ruxsat berilmagan" });
    return;
  }

  request.status = 'rejected';

  res.json({
    success: true,
    message: "So'rov rad etildi",
  });
});

export default router;
