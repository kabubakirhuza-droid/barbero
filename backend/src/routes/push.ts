import { Router, Request, Response } from 'express';
import { pushService } from '../pushService';
import { db } from '../db';

const router = Router();

// GET /push/vapid-public-key
router.get('/vapid-public-key', (req: Request, res: Response): void => {
  const key = pushService.getVapidPublicKey();
  res.json({
    publicKey: key,
  });
});

// POST /push/subscribe
router.post('/subscribe', (req: Request, res: Response): void => {
  try {
    const { userId = 'u-1', subscription, device } = req.body;
    if (!subscription) {
      res.status(400).json({ error: 'Subscription maʼlumoti kiritilmadi' });
      return;
    }

    const saved = pushService.saveSubscription(userId, subscription, device);
    res.json({
      success: true,
      message: 'Push-bildirishnomalarga muvaffaqiyatli obuna bo‘lindi',
      subscription: saved,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Obunani saqlashda xatolik' });
  }
});

// POST /push/unsubscribe
router.post('/unsubscribe', (req: Request, res: Response): void => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint kiritilmadi' });
      return;
    }

    const removed = pushService.removeSubscription(endpoint);
    res.json({
      success: true,
      removed,
      message: 'Obuna bekor qilindi',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Obunani bekor qilishda xatolik' });
  }
});

// POST /push/test - Test push notification to current device
router.post('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId = 'u-1', endpoint } = req.body;
    const result = await pushService.sendTestNotification(userId, endpoint);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Xatolik yuz berdi' });
  }
});

// GET /push/status
router.get('/status', (req: Request, res: Response): void => {
  let userId = (req.query.userId as string) || 'u-1';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token) as any;
      if (decoded?.userId) {
        userId = decoded.userId;
      }
    } catch (e) {}
  }
  const subs = pushService.getUserSubscriptions(userId);
  res.json({
    active: subs.length > 0,
    isSubscribed: subs.length > 0,
    count: subs.length,
    subscriptionsCount: subs.length,
    subscriptions: subs.map((s) => ({
      id: s.id,
      device: s.device,
      createdAt: s.createdAt,
    })),
  });
});

export default router;
