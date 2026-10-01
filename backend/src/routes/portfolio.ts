import { Router, Request, Response } from 'express';
import { db, PortfolioPhoto } from '../db';

const router = Router();

// GET /portfolio
router.get('/', (req: Request, res: Response) => {
  res.json({ photos: db.portfolio });
});

// POST /portfolio
router.post('/', (req: Request, res: Response): void => {
  const { imageUrl, caption, isPublic } = req.body;

  if (!imageUrl) {
    res.status(400).json({ error: 'Rasm havolasi kiritilishi shart' });
    return;
  }

  const newPhoto: PortfolioPhoto = {
    id: `pt-${Date.now()}`,
    imageUrl,
    caption: caption || "Yangi soch turmagi qo'shildi",
    likesCount: 0,
    isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
    createdAt: new Date().toISOString(),
  };

  db.portfolio.unshift(newPhoto);
  res.status(201).json({ success: true, photo: newPhoto });
});

// POST /portfolio/:id/like
router.post('/:id/like', (req: Request, res: Response): void => {
  const { id } = req.params;
  const photo = db.portfolio.find((p) => p.id === id);
  if (!photo) {
    res.status(404).json({ error: 'Rasm topilmadi' });
    return;
  }
  photo.likesCount += 1;
  res.json({ success: true, likesCount: photo.likesCount });
});

// DELETE /portfolio/:id
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const initialLen = db.portfolio.length;
  db.portfolio = db.portfolio.filter((p) => p.id !== id);

  if (db.portfolio.length === initialLen) {
    res.status(404).json({ error: 'Rasm topilmadi' });
    return;
  }

  res.json({ success: true, message: "Rasm o'chirildi" });
});

export default router;
