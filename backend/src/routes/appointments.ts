import { Router, Response } from 'express';
import { db, Appointment, addMinutesToTime, getTashkentNow } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Require auth on all appointment routes
router.use(authenticateToken);

// Validation helpers
function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(str || ''));
}

function isValidTime(str: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(str || ''));
}

function isPastSlot(date: string, startTime: string): boolean {
  const { dateStr: today, timeStr: nowTime } = getTashkentNow();
  if (date < today) return true;
  if (date === today && startTime < nowTime) return true;
  return false;
}

// Calculate next sequence number for "Mijoz N" on a given day
async function getNextMijozName(userId: string, date: string): Promise<string> {
  const dayAppts = await db.getAppointments(userId, date);
  let maxNum = 0;
  for (const apt of dayAppts) {
    const match = apt.clientName.match(/^Mijoz\s+(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `Mijoz ${maxNum + 1}`;
}

// GET /appointments?date=YYYY-MM-DD
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { date } = req.query;
    const list = await db.getAppointments(userId, date as string | undefined);

    // Calculate day total for valid non-cancelled appointments
    const dayTotal = list
      .filter((a) => a.status !== 'cancelled' && a.status !== 'no_show')
      .reduce((sum, item) => sum + (Number(item.servicePrice) || 0), 0);

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

    if (!isValidDate(date)) {
      res.status(400).json({ error: "Sana formati noto'g'ri (YYYY-MM-DD)" });
      return;
    }

    if (!isValidTime(startTime)) {
      res.status(400).json({ error: "Vaqt formati noto'g'ri (HH:MM)" });
      return;
    }

    if (isPastSlot(date, startTime)) {
      res.status(400).json({ error: "O'tib ketgan vaqtga yozuv yaratib bo'lmaydi" });
      return;
    }

    // Default master service from database
    const userServices = await db.getServices(userId);
    const activeServices = userServices.filter((s) => s.isActive);
    const defaultService = activeServices[0] || userServices[0] || {
      id: `srv-${userId}-def`,
      name: 'Soch olish',
      price: 50000,
      duration: 30,
      badgeColor: '#2563EB',
    };

    const duration = defaultService.duration || 30;
    const endTime = addMinutesToTime(startTime, duration);

    // Check interval collision with existing appointments & blocked slots
    if (await db.hasActiveSlotConflict(userId, date, startTime, endTime)) {
      res.status(409).json({ error: "Ushbu vaqt oralig'i allaqachon band qilingan" });
      return;
    }

    const clientName = await getNextMijozName(userId, date);

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      clientId: undefined,
      clientName,
      clientPhone: '',
      serviceId: defaultService.id,
      serviceName: defaultService.name,
      servicePrice: defaultService.price,
      badgeColor: defaultService.badgeColor || '#2563EB',
      date,
      startTime,
      endTime,
      duration,
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
      date,
      startTime,
    } = req.body;

    if (!startTime || !date) {
      res.status(400).json({ error: 'Sana va vaqt kiritilishi shart' });
      return;
    }

    if (!isValidDate(date)) {
      res.status(400).json({ error: "Sana formati noto'g'ri (YYYY-MM-DD)" });
      return;
    }

    if (!isValidTime(startTime)) {
      res.status(400).json({ error: "Vaqt formati noto'g'ri (HH:MM)" });
      return;
    }

    if (isPastSlot(date, startTime)) {
      res.status(400).json({ error: "O'tib ketgan vaqtga yozuv yaratib bo'lmaydi" });
      return;
    }

    // Resolve service from server-side database
    let srvName = 'Soch olish';
    let srvPrice = 50000;
    let srvDuration = 30;
    let srvColor = '#2563EB';
    let finalServiceId = serviceId;

    if (serviceId) {
      const srv = await db.getServiceById(serviceId);
      if (srv && srv.userId === userId) {
        srvName = srv.name;
        srvPrice = srv.price;
        srvDuration = srv.duration;
        srvColor = srv.badgeColor || '#2563EB';
      }
    } else {
      const userServices = await db.getServices(userId);
      if (userServices.length > 0) {
        srvName = userServices[0].name;
        srvPrice = userServices[0].price;
        srvDuration = userServices[0].duration;
        srvColor = userServices[0].badgeColor || '#2563EB';
        finalServiceId = userServices[0].id;
      }
    }

    const endTime = addMinutesToTime(startTime, srvDuration);

    // Check double booking interval conflict
    if (await db.hasActiveSlotConflict(userId, date, startTime, endTime)) {
      res.status(409).json({ error: "Ushbu vaqt oralig'i allaqachon band qilingan" });
      return;
    }

    const finalClientName = clientName ? String(clientName).trim().slice(0, 100) : await getNextMijozName(userId, date);
    const finalClientPhone = clientPhone ? String(clientPhone).trim().slice(0, 20) : '';

    let clientObj;
    if (finalClientPhone) {
      clientObj = await db.createOrUpdateClient(userId, finalClientName, finalClientPhone, srvPrice);
    }

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      clientId: clientObj?.id,
      clientName: finalClientName,
      clientPhone: finalClientPhone,
      serviceId: finalServiceId || 'srv-1',
      serviceName: srvName,
      servicePrice: srvPrice,
      badgeColor: srvColor,
      date,
      startTime,
      endTime,
      duration: srvDuration,
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

// PUT /appointments/:id - Edit appointment
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const current = await db.getAppointmentById(id, userId);

    if (!current) {
      res.status(404).json({ error: 'Bandlik topilmadi yoki ruxsat berilmagan' });
      return;
    }

    const allowedFields = [
      'clientName',
      'clientPhone',
      'serviceId',
      'serviceName',
      'servicePrice',
      'badgeColor',
      'date',
      'startTime',
      'endTime',
      'duration',
      'status',
      'notes',
    ];

    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        safeUpdates[key] = req.body[key];
      }
    }

    // Validate date & time format if updated
    if (safeUpdates.date && !isValidDate(safeUpdates.date)) {
      res.status(400).json({ error: "Sana formati noto'g'ri (YYYY-MM-DD)" });
      return;
    }
    if (safeUpdates.startTime && !isValidTime(safeUpdates.startTime)) {
      res.status(400).json({ error: "Vaqt formati noto'g'ri (HH:MM)" });
      return;
    }

    // If changing slot, verify no collision
    if (safeUpdates.date || safeUpdates.startTime || safeUpdates.duration) {
      const targetDate = safeUpdates.date || current.date;
      const targetTime = safeUpdates.startTime || current.startTime;
      const targetDuration = Number(safeUpdates.duration || current.duration || 30);
      const targetEndTime = safeUpdates.endTime || addMinutesToTime(targetTime, targetDuration);

      if (isPastSlot(targetDate, targetTime)) {
        res.status(400).json({ error: "O'tib ketgan vaqtga ko'chirib bo'lmaydi" });
        return;
      }

      if (await db.hasActiveSlotConflict(userId, targetDate, targetTime, targetEndTime, id)) {
        res.status(409).json({ error: "Ushbu vaqt oralig'i allaqachon band qilingan" });
        return;
      }
      safeUpdates.endTime = targetEndTime;
      safeUpdates.duration = targetDuration;
    }

    const updated = await db.updateAppointment(id, userId, safeUpdates);

    if (safeUpdates.clientName || safeUpdates.clientPhone) {
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

// PATCH /appointments/:id/status - Quick status update (Keldi, Tugadi, Kelmadi, Bekor)
router.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'arrived', 'done', 'completed', 'no_show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Noto'g'ri status (confirmed, arrived, done, no_show, cancelled)" });
      return;
    }

    const normalizedStatus = status === 'done' ? 'completed' : status;
    const updated = await db.updateAppointment(id, userId, { status: normalizedStatus as any });

    if (!updated) {
      res.status(404).json({ error: 'Bandlik topilmadi' });
      return;
    }

    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('[Appointments PATCH status error]:', error);
    res.status(500).json({ error: 'Statusni yangilashda xatolik yuz berdi' });
  }
});

// POST /appointments/:id/reschedule - Reschedule appointment in 2 taps
router.post('/:id/reschedule', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { newDate, newStartTime } = req.body;

    if (!newDate || !newStartTime) {
      res.status(400).json({ error: 'Yangi sana va vaqt kiritilishi shart' });
      return;
    }

    if (!isValidDate(newDate)) {
      res.status(400).json({ error: "Sana formati noto'g'ri (YYYY-MM-DD)" });
      return;
    }

    if (!isValidTime(newStartTime)) {
      res.status(400).json({ error: "Vaqt formati noto'g'ri (HH:MM)" });
      return;
    }

    if (isPastSlot(newDate, newStartTime)) {
      res.status(400).json({ error: "O'tib ketgan vaqtga ko'chirib bo'lmaydi" });
      return;
    }

    const current = await db.getAppointmentById(id, userId);
    if (!current) {
      res.status(404).json({ error: 'Bandlik topilmadi' });
      return;
    }

    const duration = Number(current.duration || 30);
    const newEndTime = addMinutesToTime(newStartTime, duration);

    if (await db.hasActiveSlotConflict(userId, newDate, newStartTime, newEndTime, id)) {
      res.status(409).json({ error: "Ushbu yangi vaqt oralig'i allaqachon band" });
      return;
    }

    const updated = await db.updateAppointment(id, userId, {
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
    });

    res.json({ success: true, message: 'Yozuv muvaffaqiyatli koʻchirildi', appointment: updated });
  } catch (error) {
    console.error('[Appointments POST reschedule error]:', error);
    res.status(500).json({ error: 'Yozuvni koʻchirishda xatolik yuz berdi' });
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
