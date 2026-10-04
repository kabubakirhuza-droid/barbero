import { Router, Response } from 'express';
import { db } from '../db';
import { APP_BASE_URL } from '../config';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Protect all profile endpoints
router.use(authenticateToken);

// GET /profile
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await db.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      return;
    }

    const settings = await db.getUserSettings(userId);

    res.json({
      user,
      bookingLink: `${APP_BASE_URL}/public/b/${user.username || user.id}`,
      settings,
      appVersion: '1.0.9',
    });
  } catch (error) {
    console.error('[Profile GET error]:', error);
    res.status(500).json({ error: 'Profil maʼlumotlarini yuklashda xatolik yuz berdi' });
  }
});

// PUT /profile
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const updates: any = {};
    if (req.body.fullName) updates.fullName = String(req.body.fullName).trim();
    if (req.body.bio !== undefined) updates.bio = String(req.body.bio);
    if (req.body.avatarUrl) updates.avatarUrl = String(req.body.avatarUrl);
    if (req.body.username) {
      const cleanUsername = String(req.body.username).toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername) {
        const existing = await db.getUserByUsername(cleanUsername);
        if (existing && existing.id !== userId) {
          res.status(409).json({ error: 'Bu nom band' });
          return;
        }
        updates.username = cleanUsername;
      }
    }

    const updated = await db.updateUser(userId, updates);
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('[Profile PUT error]:', error);
    res.status(500).json({ error: 'Profilni yangilashda xatolik yuz berdi' });
  }
});

// GET /profile/working-hours
router.get('/working-hours', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const workingHours = await db.getWorkingHours(userId);
    res.json({ workingHours });
  } catch (error) {
    console.error('[Profile working-hours GET error]:', error);
    res.status(500).json({ error: 'Ish vaqtini yuklashda xatolik yuz berdi' });
  }
});

// PUT /profile/working-hours
router.put('/working-hours', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { workingHours } = req.body;
    let savedHours = await db.getWorkingHours(userId);
    if (Array.isArray(workingHours)) {
      savedHours = await db.saveWorkingHours(userId, workingHours);
    }
    res.json({ success: true, workingHours: savedHours });
  } catch (error) {
    console.error('[Profile working-hours PUT error]:', error);
    res.status(500).json({ error: 'Ish vaqtini saqlashda xatolik yuz berdi' });
  }
});

// PUT /profile/settings
router.put('/settings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const updated = await db.saveUserSettings(userId, req.body);
    res.json({ success: true, settings: updated });
  } catch (error) {
    console.error('[Profile settings PUT error]:', error);
    res.status(500).json({ error: 'Sozlamalarni saqlashda xatolik yuz berdi' });
  }
});

// GET /profile/devices
router.get('/devices', (req: AuthRequest, res: Response) => {
  res.json({
    devices: [
      { id: 'dev-1', deviceName: 'Sizning qurilmangiz', os: 'Web / Mobile', location: 'Toshkent, UZ', isCurrent: true, lastActive: 'Hozir faol' },
    ],
  });
});

export default router;
