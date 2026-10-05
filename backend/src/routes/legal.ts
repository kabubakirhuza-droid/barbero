import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /legal - Public list of available legal documents
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const documents = await db.getLegalDocuments();
    res.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error('[Legal GET error]:', error);
    res.status(500).json({ error: 'Hujjatlarni yuklashda xatolik yuz berdi' });
  }
});

// GET /legal/:slug - Public single legal document
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const document = await db.getLegalDocument(slug);

    if (!document) {
      res.status(404).json({ error: 'Hujjat topilmadi' });
      return;
    }

    res.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('[Legal GET :slug error]:', error);
    res.status(500).json({ error: 'Hujjatni yuklashda xatolik yuz berdi' });
  }
});

// POST /legal/accept - Record legal document acceptance
router.post('/accept', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { slug, version } = req.body;

    if (!slug) {
      res.status(400).json({ error: 'Hujjat kodi (slug) kiritilishi shart' });
      return;
    }

    await db.acceptLegalDocument(userId, slug, version || '1.0');

    res.json({
      success: true,
      message: 'Hujjat qabul qilindi',
    });
  } catch (error) {
    console.error('[Legal POST /accept error]:', error);
    res.status(500).json({ error: 'Hujjatni qabul qilishda xatolik yuz berdi' });
  }
});

export default router;
