import { Router, Request, Response } from 'express';
import { db, Appointment } from '../db';

const router = Router();

// GET /public/b/:username - Info for public booking page
router.get('/b/:username', (req: Request, res: Response): void => {
  const { username } = req.params;
  const master = db.getUserByUsername(username) || db.getUserById(username);

  if (!master) {
    res.status(404).json({ error: 'Usta topilmadi' });
    return;
  }

  const activeServices = db.getServices(master.id).filter((s) => s.isActive);
  const workingSchedule = db.getWorkingHours(master.id);
  const photos = db.portfolioPhotos.filter((p) => p.userId === master.id && p.isPublic);
  const settings = db.getUserSettings(master.id);

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
});

// GET /public/b/:username/available-slots?date=YYYY-MM-DD
router.get('/b/:username/available-slots', (req: Request, res: Response): void => {
  const { username } = req.params;
  const master = db.getUserByUsername(username) || db.getUserById(username);

  if (!master) {
    res.status(404).json({ error: 'Usta topilmadi' });
    return;
  }

  const { date } = req.query;
  const targetDate = (date as string) || new Date().toISOString().split('T')[0];

  // Base slots
  const baseSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30'
  ];

  // Find occupied slots for this date and master
  const occupiedSlots = new Set(
    db.getAppointments(master.id, targetDate)
      .filter((a) => a.status !== 'cancelled')
      .map((a) => a.startTime)
  );

  const slots = baseSlots.map((time) => ({
    time,
    isAvailable: !occupiedSlots.has(time),
  }));

  res.json({ date: targetDate, slots });
});

// POST /public/b/:username/book - Submit booking from client
router.post('/b/:username/book', (req: Request, res: Response): void => {
  const { username } = req.params;
  const master = db.getUserByUsername(username) || db.getUserById(username);

  if (!master) {
    res.status(404).json({ error: 'Usta topilmadi' });
    return;
  }

  const { clientName, clientPhone, serviceId, date, startTime } = req.body;

  if (!clientName || !clientPhone || !serviceId || !date || !startTime) {
    res.status(400).json({ error: "Barcha maydonlarni to'ldirish shart" });
    return;
  }

  const service = db.getServiceById(serviceId) || db.getServices(master.id)[0];
  if (!service) {
    res.status(400).json({ error: 'Tanlangan xizmat topilmadi' });
    return;
  }

  // Check if slot is already occupied
  if (db.hasActiveSlotConflict(master.id, date, startTime)) {
    res.status(409).json({ error: 'Bu vaqt oralig‘i allaqachon band qilingan' });
    return;
  }

  const client = db.createOrUpdateClient(master.id, String(clientName).trim(), String(clientPhone).trim(), service.price);

  // Calculate endTime
  const [h, m] = startTime.split(':').map(Number);
  const totalM = (h || 0) * 60 + (m || 0) + (service.duration || 30);
  const endTime = `${String(Math.floor(totalM / 60) % 24).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: master.id,
    clientId: client.id,
    clientName: String(clientName).trim(),
    clientPhone: String(clientPhone).trim(),
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    badgeColor: service.badgeColor || '#A67C2E',
    date,
    startTime,
    endTime,
    duration: service.duration || 30,
    status: 'confirmed',
  };

  db.createAppointment(newAppointment);

  console.log(`[PublicBooking] New appointment booked for master ${master.fullName} by ${clientName} on ${date} at ${startTime}`);

  res.status(201).json({
    success: true,
    message: 'Bandlik muvaffaqiyatli saqlandi!',
    appointment: newAppointment,
  });
});

export default router;
