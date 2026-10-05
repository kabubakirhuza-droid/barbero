import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Require auth on all call-log routes (only master sees their own call log)
router.use(authenticateToken);

// GET /call-log?limit=20 - Return last 20 unique callers from past 30 days
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const logs = await db.getCallLogs(userId, limit);

    res.json({
      success: true,
      count: logs.length,
      callLogs: logs,
    });
  } catch (error) {
    console.error('[CallLog GET error]:', error);
    res.status(500).json({ error: 'Qoʻngʻiroqlar jurnalini yuklashda xatolik yuz berdi' });
  }
});

// Helper to normalize and validate Uzbekistan phone
export function normalizeUzPhone(raw: string): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 9) {
    digits = `998${digits}`;
  }
  return `+${digits}`;
}

// POST /call-log - Record outgoing or incoming manual call
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { phone, name, direction } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Telefon raqam kiritilishi shart' });
      return;
    }

    const normalizedPhone = normalizeUzPhone(phone);
    if (!/^\+998\d{9}$/.test(normalizedPhone)) {
      res.status(400).json({ error: "Telefon raqami noto'g'ri. +998XXXXXXXXX formatida kiriting (masalan, +998901234567)" });
      return;
    }

    const cleanName = name ? String(name).trim().slice(0, 100) : '';
    const cleanPhone = normalizedPhone.slice(0, 20);
    const cleanDirection = ['outgoing_call', 'incoming_manual', 'booking_request', 'appointment'].includes(direction)
      ? direction
      : 'outgoing_call';

    const item = await db.addCallLog(userId, cleanPhone, cleanName, cleanDirection);

    res.status(201).json({
      success: true,
      callLog: item,
    });
  } catch (error) {
    console.error('[CallLog POST error]:', error);
    res.status(500).json({ error: 'Qoʻngʻiroqni jurnalga saqlashda xatolik yuz berdi' });
  }
});

export default router;
