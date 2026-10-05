import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Require auth on all notification endpoints
router.use(authenticateToken);

// GET /notifications - Get master/client notifications
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const notifications = await db.getNotifications(userId);
    const unreadCount = notifications.filter((n) => !n.readAt).length;

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('[Notifications GET error]:', error);
    res.status(500).json({ error: 'Bildirishnomalarni yuklashda xatolik yuz berdi' });
  }
});

// PATCH /notifications/:id/read - Mark single notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const updated = await db.markNotificationRead(id, userId);
    if (!updated) {
      res.status(404).json({ error: 'Bildirishnoma topilmadi' });
      return;
    }

    res.json({
      success: true,
      message: 'Bildirishnoma o‘qildi deb belgilandi',
    });
  } catch (error) {
    console.error('[Notifications PATCH read error]:', error);
    res.status(500).json({ error: 'Bildirishnomani yangilashda xatolik yuz berdi' });
  }
});

// POST /notifications/read-all - Mark all as read
router.post('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await db.markAllNotificationsRead(userId);

    res.json({
      success: true,
      message: 'Barcha bildirishnomalar o‘qildi deb belgilandi',
    });
  } catch (error) {
    console.error('[Notifications POST read-all error]:', error);
    res.status(500).json({ error: 'Bildirishnomalarni yangilashda xatolik yuz berdi' });
  }
});

export default router;
