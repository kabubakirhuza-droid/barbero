import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /working-hours
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const workingHours = await db.getWorkingHours(userId);
    res.json({ success: true, workingHours });
  } catch (error) {
    console.error('[working-hours GET error]:', error);
    res.status(500).json({ error: 'Ish vaqtini yuklashda xatolik yuz berdi' });
  }
});

// PUT /working-hours
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { workingHours } = req.body;
    let savedHours = await db.getWorkingHours(userId);
    if (Array.isArray(workingHours)) {
      savedHours = await db.saveWorkingHours(userId, workingHours);
    }
    res.json({ success: true, workingHours: savedHours });
  } catch (error) {
    console.error('[working-hours PUT error]:', error);
    res.status(500).json({ error: 'Ish vaqtini saqlashda xatolik yuz berdi' });
  }
});

export default router;
