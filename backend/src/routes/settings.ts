import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /settings
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const settings = await db.getUserSettings(userId);
    res.json({ success: true, settings });
  } catch (error) {
    console.error('[settings GET error]:', error);
    res.status(500).json({ error: 'Sozlamalarni yuklashda xatolik yuz berdi' });
  }
});

// PUT /settings
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const updated = await db.saveUserSettings(userId, req.body);
    res.json({ success: true, settings: updated });
  } catch (error) {
    console.error('[settings PUT error]:', error);
    res.status(500).json({ error: 'Sozlamalarni saqlashda xatolik yuz berdi' });
  }
});

export default router;
