import { Router, Request, Response } from 'express';
import { db } from '../db';
import { APP_BASE_URL } from '../config';

const router = Router();

// GET /profile
router.get('/', (req: Request, res: Response) => {
  const user = db.users[0];
  res.json({
    user,
    bookingLink: `${APP_BASE_URL}/b/${user.username}`,
    settings: db.userSettings,
    appVersion: '1.0.9',
  });
});

// PUT /profile
router.put('/', (req: Request, res: Response): void => {
  const user = db.users[0];
  if (req.body.fullName) user.fullName = req.body.fullName;
  if (req.body.bio !== undefined) user.bio = req.body.bio;
  if (req.body.avatarUrl) user.avatarUrl = req.body.avatarUrl;
  res.json({ success: true, user });
});

// GET /profile/working-hours
router.get('/working-hours', (req: Request, res: Response) => {
  res.json({ workingHours: db.workingHours });
});

// PUT /profile/working-hours
router.put('/working-hours', (req: Request, res: Response): void => {
  const { workingHours } = req.body;
  if (Array.isArray(workingHours)) {
    db.workingHours = workingHours;
  }
  res.json({ success: true, workingHours: db.workingHours });
});

// PUT /profile/settings
router.put('/settings', (req: Request, res: Response): void => {
  db.userSettings = {
    ...db.userSettings,
    ...req.body,
  };
  res.json({ success: true, settings: db.userSettings });
});

// GET /profile/devices
router.get('/devices', (req: Request, res: Response) => {
  res.json({
    devices: [
      { id: 'dev-1', deviceName: 'iPhone 15 Pro', os: 'iOS 18.0', location: 'Toshkent, UZ', isCurrent: true, lastActive: 'Hozir faol' },
      { id: 'dev-2', deviceName: 'MacBook Pro 14"', os: 'macOS Sequoia', location: 'Toshkent, UZ', isCurrent: false, lastActive: '2 soat oldin' },
    ],
  });
});

export default router;
