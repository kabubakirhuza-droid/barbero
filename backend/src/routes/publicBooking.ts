import { Router, Request, Response } from 'express';
import { db, Appointment, Client } from '../db';

const router = Router();

// GET /public/b/:username - Info for public booking page
router.get('/b/:username', (req: Request, res: Response): void => {
  const { username } = req.params;
  const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || db.users[0];

  const activeServices = db.services.filter((s) => s.isActive);
  const workingSchedule = db.workingHours;
  const photos = db.portfolio.filter((p) => p.isPublic);

  res.json({
    master: {
      name: user.fullName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      workingDays: 'Dush – Shan 09:00 – 21:00',
      bookingWindowDays: 14,
    },
    services: activeServices,
    workingHours: workingSchedule,
    portfolio: photos,
    settings: {
      bookingLinkActive: db.userSettings.bookingLinkActive,
      allowCustomTimeRequest: db.userSettings.allowCustomTimeRequest,
      allowLunchTimeBooking: db.userSettings.allowLunchTimeBooking,
    },
  });
});

// GET /public/b/:username/available-slots?date=YYYY-MM-DD
router.get('/b/:username/available-slots', (req: Request, res: Response): void => {
  const { date } = req.query;
  const targetDate = (date as string) || new Date().toISOString().split('T')[0];

  // Standard working hours 09:00 - 21:00 with 30 min intervals
  const baseSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30'
  ];

  // Find occupied slots for this date
  const occupiedSlots = new Set(
    db.appointments
      .filter((a) => a.date === targetDate && a.status !== 'cancelled')
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
  const { clientName, clientPhone, serviceId, date, startTime } = req.body;

  if (!clientName || !clientPhone || !serviceId || !date || !startTime) {
    res.status(400).json({ error: "Barcha maydonlarni to'ldirish shart" });
    return;
  }

  const service = db.services.find((s) => s.id === serviceId) || db.services[0];

  // Check if slot is already occupied
  const alreadyBooked = db.appointments.some(
    (a) => a.date === date && a.startTime === startTime && a.status !== 'cancelled'
  );

  if (alreadyBooked) {
    res.status(409).json({ error: 'Bu vaqt allaqachon band qilingan' });
    return;
  }

  let client = db.clients.find((c) => c.phone === clientPhone);
  if (!client) {
    client = {
      id: `c-${Date.now()}`,
      userId: 'u-1',
      name: clientName,
      phone: clientPhone,
      totalSpent: service.price,
      visitsCount: 1,
    };
    db.clients.push(client);
  } else {
    client.visitsCount += 1;
    client.totalSpent += service.price;
  }

  // Calculate endTime
  const [h, m] = startTime.split(':').map(Number);
  const totalM = h * 60 + m + service.duration;
  const endTime = `${String(Math.floor(totalM / 60) % 24).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    userId: 'u-1',
    clientId: client.id,
    clientName,
    clientPhone,
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    badgeColor: service.badgeColor,
    date,
    startTime,
    endTime,
    duration: service.duration,
    status: 'confirmed',
  };

  db.appointments.push(newAppointment);

  console.log(`[PublicBooking] New appointment booked by ${clientName} (${clientPhone}) on ${date} at ${startTime}`);

  res.status(201).json({
    success: true,
    message: 'Bandlik muvaffaqiyatli saqlandi!',
    appointment: newAppointment,
  });
});

export default router;
