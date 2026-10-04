import { Router, Response } from 'express';
import { db } from '../db';
import { APP_BASE_URL } from '../config';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Protect all profile endpoints
router.use(authenticateToken);

// GET /profile
router.get('/', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const user = db.getUserById(userId);

  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  const settings = db.getUserSettings(userId);

  res.json({
    user,
    bookingLink: `${APP_BASE_URL}/public/b/${user.username || user.id}`,
    settings,
    appVersion: '1.0.9',
  });
});

// PUT /profile
router.put('/', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const updates: any = {};
  if (req.body.fullName) updates.fullName = String(req.body.fullName).trim();
  if (req.body.bio !== undefined) updates.bio = String(req.body.bio);
  if (req.body.avatarUrl) updates.avatarUrl = String(req.body.avatarUrl);
  if (req.body.username) updates.username = String(req.body.username).toLowerCase().replace(/[^a-z0-9_]/g, '');

  const updated = db.updateUser(userId, updates);
  res.json({ success: true, user: updated });
});

// GET /profile/working-hours
router.get('/working-hours', (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const workingHours = db.getWorkingHours(userId);
  res.json({ workingHours });
});

// PUT /profile/working-hours
router.put('/working-hours', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const { workingHours } = req.body;
  if (Array.isArray(workingHours)) {
    db.updateWorkingHours(userId, workingHours);
  }
  res.json({ success: true, workingHours: db.getWorkingHours(userId) });
});

// PUT /profile/settings
router.put('/settings', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const updated = db.updateUserSettings(userId, req.body);
  res.json({ success: true, settings: updated });
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
