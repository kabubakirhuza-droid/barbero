import { Router, Request, Response } from 'express';
import { db, BookingRequest, Appointment } from '../db';

const router = Router();

// GET /booking-requests - List of booking requests
router.get('/', (req: Request, res: Response): void => {
  const masterId = (req.query.masterId as string) || 'u-1';
  const requests = db.bookingRequests
    .filter((r) => r.masterId === masterId && r.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    requests,
    count: requests.length,
  });
});

// POST /booking-requests - Client submits request from public booking page
router.post('/', (req: Request, res: Response): void => {
  const { masterId, clientName, clientPhone, serviceId, date, time } = req.body;

  if (!clientName || !clientPhone || !serviceId || !date || !time) {
    res.status(400).json({ error: "Barcha maydonlarni to'ldirish shart" });
    return;
  }

  const service = db.services.find((s) => s.id === serviceId) || db.services[0];

  const newRequest: BookingRequest = {
    id: `req-${Date.now()}`,
    masterId: masterId || 'u-1',
    clientName: clientName.trim(),
    clientPhone: clientPhone.trim(),
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    date,
    time,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.bookingRequests.unshift(newRequest);

  res.status(201).json({
    success: true,
    message: "So'rov muvaffaqiyatli yuborildi!",
    request: newRequest,
  });
});

// POST /booking-requests/:id/accept - Master accepts request -> creates appointment in schedule
router.post('/:id/accept', (req: Request, res: Response): void => {
  const { id } = req.params;
  const request = db.bookingRequests.find((r) => r.id === id);

  if (!request) {
    res.status(404).json({ error: "So'rov topilmadi" });
    return;
  }

  request.status = 'accepted';

  // Calculate end time
  const [h, m] = request.time.split(':').map(Number);
  const totalM = (h || 9) * 60 + (m || 0) + 30;
  const endTime = `${String(Math.floor(totalM / 60) % 24).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    userId: request.masterId,
    clientId: `c-${Date.now()}`,
    clientName: request.clientName,
    clientPhone: request.clientPhone,
    serviceId: request.serviceId,
    serviceName: request.serviceName,
    servicePrice: request.servicePrice,
    badgeColor: '#A67C2E',
    date: request.date,
    startTime: request.time,
    endTime,
    duration: 30,
    status: 'confirmed',
  };

  db.appointments.push(newAppointment);

  res.json({
    success: true,
    message: "So'rov qabul qilindi va jadvalga qo'shildi",
    appointment: newAppointment,
  });
});

// POST /booking-requests/:id/reject - Master rejects request
router.post('/:id/reject', (req: Request, res: Response): void => {
  const { id } = req.params;
  const request = db.bookingRequests.find((r) => r.id === id);

  if (!request) {
    res.status(404).json({ error: "So'rov topilmadi" });
    return;
  }

  request.status = 'rejected';

  res.json({
    success: true,
    message: "So'rov rad etildi",
  });
});

export default router;
