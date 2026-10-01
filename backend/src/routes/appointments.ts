import { Router, Request, Response } from 'express';
import { db, Appointment, Client } from '../db';

const router = Router();

// GET /appointments?date=YYYY-MM-DD
router.get('/', (req: Request, res: Response) => {
  const { date } = req.query;
  let list = db.appointments;

  if (date) {
    list = list.filter((a) => a.date === date);
  }

  // Calculate day total
  const dayTotal = list
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, item) => sum + item.servicePrice, 0);

  res.json({
    appointments: list,
    dayTotal,
    count: list.length,
  });
});

// POST /appointments/quick - 1-Click Instant Booking on Free Slot
router.post('/quick', (req: Request, res: Response): void => {
  const { date, startTime } = req.body;

  if (!date || !startTime) {
    res.status(400).json({ error: 'Sana va vaqt kiritilishi shart' });
    return;
  }

  // Sequential Mijoz N number
  const nextOrderNumber = db.appointments.length + 1;
  const clientName = `Mijoz ${nextOrderNumber}`;
  const defaultClientPhone = '';

  // Default service: first service in list ("Soch olish", 50 000 uzs, 30 min)
  const defaultService = db.services[0] || {
    id: 'srv-1',
    name: 'Soch olish',
    price: 50000,
    duration: 30,
    badgeColor: '#A67C2E',
  };

  // Calculate end time
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + defaultService.duration;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    userId: 'u-1',
    clientId: `c-${Date.now()}`,
    clientName,
    clientPhone: defaultClientPhone,
    serviceId: defaultService.id,
    serviceName: defaultService.name,
    servicePrice: defaultService.price,
    badgeColor: defaultService.badgeColor,
    date,
    startTime,
    endTime,
    duration: defaultService.duration,
    status: 'confirmed',
  };

  db.appointments.push(newAppointment);

  res.status(201).json({
    success: true,
    message: 'Tezkor yozuv yaratildi',
    appointment: newAppointment,
  });
});

// POST /appointments - Standard creation
router.post('/', (req: Request, res: Response): void => {
  const {
    clientName,
    clientPhone,
    serviceId,
    serviceName,
    servicePrice,
    badgeColor,
    date,
    startTime,
    duration = 30,
  } = req.body;

  if (!startTime || !date) {
    res.status(400).json({ error: 'Sana va vaqt kiritilishi shart' });
    return;
  }

  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Number(duration);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    userId: 'u-1',
    clientId: `c-${Date.now()}`,
    clientName: clientName || `Mijoz ${db.appointments.length + 1}`,
    clientPhone: clientPhone || '',
    serviceId: serviceId || 'srv-1',
    serviceName: serviceName || 'Soch olish',
    servicePrice: Number(servicePrice) || 50000,
    badgeColor: badgeColor || '#A67C2E',
    date,
    startTime,
    endTime,
    duration: Number(duration),
    status: 'confirmed',
  };

  db.appointments.push(newAppointment);
  res.status(201).json({ success: true, appointment: newAppointment });
});

// PUT /appointments/:id - Edit client name, phone, service, date
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = db.appointments.findIndex((a) => a.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Bandlik topilmadi' });
    return;
  }

  const current = db.appointments[index];
  db.appointments[index] = {
    ...current,
    ...req.body,
  };

  // If client details updated, update the client entity as well
  if (req.body.clientName || req.body.clientPhone) {
    const client = db.clients.find((c) => c.id === current.clientId);
    if (client) {
      if (req.body.clientName) client.name = req.body.clientName;
      if (req.body.clientPhone) client.phone = req.body.clientPhone;
    }
  }

  res.json({ success: true, appointment: db.appointments[index] });
});

// DELETE /appointments/:id
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const initialLen = db.appointments.length;
  db.appointments = db.appointments.filter((a) => a.id !== id);

  if (db.appointments.length === initialLen) {
    res.status(404).json({ error: 'Bandlik topilmadi' });
    return;
  }

  res.json({ success: true, message: "Bandlik bekor qilindi va o'chirildi" });
});

export default router;
