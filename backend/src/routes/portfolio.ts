import { Router, Response } from 'express';
import { db, PortfolioPhoto } from '../db';
import { optionalAuth, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /portfolio
router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = (req.query.userId as string) || req.user?.userId;
    const photos = await db.getPortfolioPhotos(targetUserId);
    res.json({ photos });
  } catch (error) {
    console.error('[Portfolio GET error]:', error);
    res.status(500).json({ error: 'Portfolio rasmlarini yuklashda xatolik yuz berdi' });
  }
});

// POST /portfolio (Protected)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
    };

    const saved = await db.addPortfolioPhoto(newPhoto);
    res.status(201).json({ success: true, photo: saved });
  } catch (error) {
    console.error('[Portfolio POST error]:', error);
    res.status(500).json({ error: 'Rasmni saqlashda xatolik yuz berdi' });
  }
});

// POST /portfolio/:id/like
router.post('/:id/like', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const likesCount = await db.likePortfolioPhoto(id);
    res.json({ success: true, likesCount });
  } catch (error) {
    console.error('[Portfolio LIKE error]:', error);
    res.status(500).json({ error: 'Layk bosishda xatolik yuz berdi' });
  }
});

// DELETE /portfolio/:id (Protected)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const deleted = await db.deletePortfolioPhoto(id, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Rasm topilmadi yoki ruxsat berilmagan' });
      return;
    }

    res.json({ success: true, message: "Rasm o'chirildi" });
  } catch (error) {
    console.error('[Portfolio DELETE error]:', error);
    res.status(500).json({ error: "Rasmni o'chirishda xatolik yuz berdi" });
  }
});

export default router;
