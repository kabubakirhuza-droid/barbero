import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const DEFAULT_LEGAL_DOCS: Record<string, any> = {
  oferta: {
    slug: 'oferta',
    titleUz: 'Ommaviy oferta',
    titleRu: 'Публичная оферта',
    bodyUz: "Barbero xizmatidan foydalanish bo'yicha ommaviy oferta shartlari. Ushbu hujjat xizmat ko'rsatuvchi va foydalanuvchi o'rtasidagi huquqiy munosabatlarni tartibga soladi.",
    bodyRu: 'Условия публичной оферты по использованию сервиса Barbero. Настоящий документ регулирует правоотношения между сервисом и пользователем.',
    version: '1.0',
    publishedAt: new Date().toISOString(),
  },
  maxfiylik: {
    slug: 'maxfiylik',
    titleUz: 'Maxfiylik siyosati',
    titleRu: 'Политика конфиденциальности',
    bodyUz: "Barbero foydalanuvchilarining shaxsiy ma'lumotlarini himoya qilish va qayta ishlash siyosati.",
    bodyRu: 'Политика защиты и обработки персональных данных пользователей Barbero.',
    version: '1.0',
    publishedAt: new Date().toISOString(),
  },
  'mijozlar-maxfiylik': {
    slug: 'mijozlar-maxfiylik',
    titleUz: 'Mijozlar uchun maxfiylik siyosati',
    titleRu: 'Политика конфиденциальности для клиентов',
    bodyUz: "Mijozlar yozuvlari va telefon raqamlari xavfsizligini ta'minlash shartlari.",
    bodyRu: 'Условия обеспечения безопасности записей и номеров телефонов клиентов.',
    version: '1.0',
    publishedAt: new Date().toISOString(),
  },
};

// GET /legal - Public list of available legal documents
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const documents = await db.getLegalDocuments();
    res.json({
      success: true,
      documents: documents && documents.length > 0 ? documents : Object.values(DEFAULT_LEGAL_DOCS),
    });
  } catch (error) {
    // Graceful fallback to static documents if DB is initializing or offline
    res.json({
      success: true,
      documents: Object.values(DEFAULT_LEGAL_DOCS),
    });
  }
});

// GET /legal/:slug - Public single legal document
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    let document = await db.getLegalDocument(slug);

    if (!document) {
      document = DEFAULT_LEGAL_DOCS[slug] || null;
    }

    if (!document) {
      res.status(404).json({ error: 'Hujjat topilmadi' });
      return;
    }

    res.json({
      success: true,
      document,
    });
  } catch (error) {
    const { slug } = req.params;
    const document = DEFAULT_LEGAL_DOCS[slug];
    if (document) {
      res.json({
        success: true,
        document,
      });
      return;
    }
    res.status(404).json({ error: 'Hujjat topilmadi' });
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
  } catch (error: any) {
    if (error?.status === 503) {
      res.status(503).json({ error: 'Maʼlumotlar bazasi vaqtincha ulanmagan (503)' });
      return;
    }
    console.error('[Legal POST /accept error]:', error);
    res.status(500).json({ error: 'Hujjatni qabul qilishda xatolik yuz berdi' });
  }
});

export default router;
