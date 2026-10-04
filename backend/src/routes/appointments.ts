import { Router, Response } from 'express';
import { db, Appointment } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Require auth on all appointment routes
router.use(authenticateToken);

// GET /appointments?date=YYYY-MM-DD
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { date } = req.query;
    const list = await db.getAppointments(userId, date as string | undefined);

    // Calculate day total
    const dayTotal = list
      .filter((a) => a.status !== 'cancelled')
      .reduce((sum, item) => sum + item.servicePrice, 0);

    res.json({
      appointments: list,
      dayTotal,
      count: list.length,
    });
  } catch (error) {
    console.error('[Appointments GET error]:', error);
    res.status(500).json({ error: 'Bandliklarni yuklashda xatolik yuz berdi' });
  }
});

// POST /appointments/quick - 1-Click Instant Booking on Free Slot
router.post('/quick', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { date, startTime } = req.body;

    if (!date || !startTime) {
      res.status(400).json({ error: 'Sana va vaqt kiritilishi shart' });
      return;
    }

    // Check double booking
    if (await db.hasActiveSlotConflict(userId, date, startTime)) {
      res.status(409).json({ error: "Ushbu vaqt oralig'i allaqachon band qilingan" });
      return;
    }

    // Default master service
    const userServices = await db.getServices(userId);
    const defaultService = userServices[0] || {
      id: `srv-${userId}-def`,
      name: 'Soch olish',
      price: 50000,
      duration: 30,
      badgeColor: '#A67C2E',
    };

    const nextOrderNumber = (await db.getAppointments(userId, date)).length + 1;
    const clientName = `Mijoz ${nextOrderNumber}`;
    const defaultClientPhone = '';

    // Calculate end time
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = (hours || 0) * 60 + (minutes || 0) + defaultService.duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      clientId: undefined,
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

    await db.createAppointment(newAppointment);

    res.status(201).json({
      success: true,
      message: 'Tezkor yozuv yaratildi',
      appointment: newAppointment,
    });
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.code === 'SLOT_OCCUPIED') {
      res.status(409).json({ error: "Ushbu vaqt oralig'i allaqachon band qilingan" });
      return;
    }
    console.error('[Appointments POST quick error]:', error);
    res.status(500).json({ error: 'Tezkor yozuvni saqlashda xatolik yuz berdi' });
  }
});

// POST /appointments - Standard creation
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
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

    // Check double booking conflict
    if (await db.hasActiveSlotConflict(userId, date, startTime)) {
      res.status(409).json({ error: "Ushbu vaqt oralig'i allaqachon band qilingan" });
      return;
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = (hours || 0) * 60 + (minutes || 0) + Number(duration);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    const appts = await db.getAppointments(userId);
    const finalClientName = clientName ? String(clientName).trim() : `Mijoz ${appts.length + 1}`;
    const finalClientPhone = clientPhone ? String(clientPhone).trim() : '';
    const finalPrice = Number(servicePrice) || 50000;

    let clientObj;
    if (finalClientPhone) {
      clientObj = await db.createOrUpdateClient(userId, finalClientName, finalClientPhone, finalPrice);
    }

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      clientId: clientObj?.id,
      clientName: finalClientName,
      clientPhone: finalClientPhone,
      serviceId: serviceId || 'srv-1',
      serviceName: serviceName || 'Soch olish',
      servicePrice: finalPrice,
      badgeColor: badgeColor || '#A67C2E',
      date,
      startTime,
      endTime,
      duration: Number(duration),
      status: 'confirmed',
    };

    await db.createAppointment(newAppointment);
    res.status(201).json({ success: true, appointment: newAppointment });
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.code === 'SLOT_OCCUPIED') {
      res.status(409).json({ error: "Ushbu vaqt oralig'i allaqachon band qilingan" });
      return;
    }
    console.error('[Appointments POST error]:', error);
    res.status(500).json({ error: 'Bandlikni yaratishda xatolik yuz berdi' });
  }
});

// PUT /appointments/:id - Edit client name, phone, service, date
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const current = await db.getAppointmentById(id);

    if (!current || current.userId !== userId) {
      res.status(404).json({ error: 'Bandlik topilmadi yoki ruxsat berilmagan' });
      return;
    }

    // If changing slot, verify no collision
    if (req.body.date || req.body.startTime) {
      const targetDate = req.body.date || current.date;
      const targetTime = req.body.startTime || current.startTime;
      if (await db.hasActiveSlotConflict(userId, targetDate, targetTime, id)) {
        res.status(409).json({ error: "Ushbu vaqt oralig'i allaqachon band qilingan" });
        return;
      }
    }

    const updated = await db.updateAppointment(id, userId, {
      ...req.body,
    });

    // If client details updated, sync client entity
    if (req.body.clientName || req.body.clientPhone) {
      if (updated?.clientPhone) {
        await db.createOrUpdateClient(userId, updated.clientName, updated.clientPhone, 0);
      }
    }

    res.json({ success: true, appointment: updated });
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.code === 'SLOT_OCCUPIED') {
      res.status(409).json({ error: "Ushbu vaqt oralig'i allaqachon band qilingan" });
      return;
    }
    console.error('[Appointments PUT error]:', error);
    res.status(500).json({ error: 'Bandlikni yangilashda xatolik yuz berdi' });
  }
});

// DELETE /appointments/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const current = await db.getAppointmentById(id, userId);

    if (!current) {
      res.status(404).json({ error: 'Bandlik topilmadi yoki ruxsat berilmagan' });
      return;
    }

    await db.deleteAppointment(id, userId);
    res.json({ success: true, message: "Bandlik bekor qilindi va o'chirildi" });
  } catch (error) {
    console.error('[Appointments DELETE error]:', error);
    res.status(500).json({ error: "Bandlikni o'chirishda xatolik yuz berdi" });
  }
});

export default router;
