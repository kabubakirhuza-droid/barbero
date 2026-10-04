import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET /reviews/:masterId - Get master reviews and average rating
router.get('/:masterId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { masterId } = req.params;
    const data = await db.getReviewsByMasterId(masterId);
    res.json(data);
  } catch (error) {
    console.error('[Reviews GET error]:', error);
    res.status(500).json({ error: 'Sharhlarni yuklashda xatolik yuz berdi' });
  }
});

// POST /reviews/:masterId - Submit review (from client or public booking)
router.post('/:masterId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { masterId } = req.params;
    const { clientName, rating, comment } = req.body;

    if (!clientName || !clientName.trim()) {
      res.status(400).json({ error: 'Ismingizni kiritishingiz shart' });
      return;
    }

    const review = await db.createReview({
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      masterId,
      clientName: String(clientName).trim(),
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      comment: comment ? String(comment).trim() : undefined,
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('[Reviews POST error]:', error);
    res.status(500).json({ error: 'Sharh qoldirishda xatolik yuz berdi' });
  }
});

export default router;
