import { Router, Response } from 'express';
import { db, PortfolioPhoto } from '../db';
import { optionalAuth, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /portfolio
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const targetUserId = (req.query.userId as string) || req.user?.userId || 'u-1';
  const photos = db.portfolioPhotos.filter((p) => p.userId === targetUserId || p.isPublic);
  res.json({ photos });
});

// POST /portfolio (Protected)
router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const { imageUrl, caption, isPublic } = req.body;

  if (!imageUrl) {
    res.status(400).json({ error: 'Rasm havolasi kiritilishi shart' });
    return;
  }

  const newPhoto: PortfolioPhoto = {
    id: `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    imageUrl: String(imageUrl).trim(),
    caption: caption ? String(caption).trim() : "Yangi turmak qo'shildi",
    likesCount: 0,
    isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
    createdAt: new Date().toISOString(),
  };

  db.portfolioPhotos.unshift(newPhoto);
  res.status(201).json({ success: true, photo: newPhoto });
});

// POST /portfolio/:id/like
router.post('/:id/like', (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const photo = db.portfolioPhotos.find((p) => p.id === id);
  if (!photo) {
    res.status(404).json({ error: 'Rasm topilmadi' });
    return;
  }
  photo.likesCount += 1;
  res.json({ success: true, likesCount: photo.likesCount });
});

// DELETE /portfolio/:id (Protected)
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const initialLen = db.portfolioPhotos.length;
  db.portfolioPhotos = db.portfolioPhotos.filter((p) => !(p.id === id && p.userId === userId));

  if (db.portfolioPhotos.length === initialLen) {
    res.status(404).json({ error: 'Rasm topilmadi yoki ruxsat berilmagan' });
    return;
  }

  res.json({ success: true, message: "Rasm o'chirildi" });
});

export default router;
