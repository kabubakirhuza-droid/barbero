import { Router, Response } from 'express';
import { db, addMinutesToTime } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Require auth on blocked-slots routes
router.use(authenticateToken);

// Validation helpers
function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(str || ''));
}

function isValidTime(str: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(str || ''));
}

// GET /blocked-slots?date=YYYY-MM-DD
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { date } = req.query;

    const slots = await db.getBlockedSlots(userId, date as string | undefined);

    res.json({
      success: true,
      count: slots.length,
      blockedSlots: slots,
    });
  } catch (error) {
    console.error('[BlockedSlots GET error]:', error);
    res.status(500).json({ error: 'Dam olish vaqtlarini yuklashda xatolik yuz berdi' });
  }
});

// POST /blocked-slots - Block slot (Dam olish / Tushlik)
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { appointmentDate, startTime, endTime, reason } = req.body;

    if (!appointmentDate || !startTime) {
      res.status(400).json({ error: 'Sana va vaqt kiritilishi shart' });
      return;
    }

    if (!isValidDate(appointmentDate)) {
      res.status(400).json({ error: "Sana formati noto'g'ri (YYYY-MM-DD)" });
      return;
    }

    if (!isValidTime(startTime)) {
      res.status(400).json({ error: "Boshlanish vaqti formati noto'g'ri (HH:MM)" });
      return;
    }

    let finalEndTime = endTime;
    if (!finalEndTime || finalEndTime <= startTime) {
      finalEndTime = addMinutesToTime(startTime, 30);
    }

    if (!isValidTime(finalEndTime)) {
      res.status(400).json({ error: "Tugash vaqti formati noto'g'ri (HH:MM)" });
      return;
    }

    // Check if slot interval conflicts with any active appointment or blocked slot
    const hasConflict = await db.hasActiveSlotConflict(userId, appointmentDate, startTime, finalEndTime);
    if (hasConflict) {
      res.status(409).json({ error: "Ushbu vaqt oralig'ida allaqachon yozuv yoki dam olish mavjud" });
      return;
    }

    const item = await db.createBlockedSlot({
      userId,
      appointmentDate,
      startTime,
      endTime: finalEndTime,
      reason: reason ? String(reason).trim().slice(0, 100) : 'Dam olish',
    });

    res.status(201).json({
      success: true,
      message: 'Vaqt muvaffaqiyatli yopildi (Dam olish)',
      blockedSlot: item,
    });
  } catch (error) {
    console.error('[BlockedSlots POST error]:', error);
    res.status(500).json({ error: 'Vaqtni yopishda xatolik yuz berdi' });
  }
});

// DELETE /blocked-slots/:id - Open blocked slot back up
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const deleted = await db.deleteBlockedSlot(id, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Yopiq vaqt topilmadi' });
      return;
    }

    res.json({
      success: true,
      message: 'Vaqt qayta ochildi',
    });
  } catch (error) {
    console.error('[BlockedSlots DELETE error]:', error);
    res.status(500).json({ error: 'Vaqtni ochishda xatolik yuz berdi' });
  }
});

export default router;
