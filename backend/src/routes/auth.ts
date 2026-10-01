import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db, User } from '../db';
import { telegramGateway } from '../telegramGateway';

const router = Router();

interface VerificationSession {
  phone: string;
  requestId: string;
  sentAt: number;
  attempts: number;
}

// In-memory verification storage keyed by phone
const verificationSessions = new Map<string, VerificationSession>();
// Also keyed by requestId for fast lookup
const sessionsByRequestId = new Map<string, VerificationSession>();

// POST /auth/send-code
router.post('/send-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Telefon raqam kiritilishi shart' });
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      res.status(400).json({ error: "Telefon raqami + bilan boshlanishi kerak (masalan, +998901234567)" });
      return;
    }

    // Rate limit: 1 send per 60 seconds
    const existing = verificationSessions.get(cleanPhone);
    const now = Date.now();
    if (existing && now - existing.sentAt < config.rateLimitSeconds * 1000) {
      const remainingSeconds = Math.ceil((config.rateLimitSeconds * 1000 - (now - existing.sentAt)) / 1000);
      res.status(429).json({
        error: `Iltimos, qayta yuborishdan oldin ${remainingSeconds} soniya kuting`,
        retryAfter: remainingSeconds,
      });
      return;
    }

    console.log(`[TelegramGateway] Sending verification code to ${cleanPhone}...`);

    // Call real Telegram Gateway API
    const result = await telegramGateway.sendVerificationMessage(cleanPhone);

    if (!result.success || !result.requestId) {
      res.status(400).json({
        error: result.error || "Telegram orqali kod yuborishda xatolik yuz berdi",
      });
      return;
    }

    const session: VerificationSession = {
      phone: cleanPhone,
      requestId: result.requestId,
      sentAt: now,
      attempts: 0,
    };

    verificationSessions.set(cleanPhone, session);
    sessionsByRequestId.set(result.requestId, session);

    console.log(`[TelegramGateway] Code sent via Telegram Gateway! RequestId: ${result.requestId}`);

    res.json({
      success: true,
      message: 'Tasdiqlash kodi Telegram orqali yuborildi',
      requestId: result.requestId,
      phone: cleanPhone,
      ttl: 60,
    });
  } catch (error: any) {
    console.error('[Auth Error /send-code]:', error);
    res.status(500).json({ error: 'Kodni yuborishda server xatoligi yuz berdi' });
  }
});

// POST /auth/verify
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code, requestId } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Kod kiritilishi shart' });
      return;
    }

    const cleanCode = String(code).trim();
    if (cleanCode.length !== 6) {
      res.status(400).json({ error: 'Kod 6 ta raqamdan iborat bo‘lishi kerak' });
      return;
    }

    const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';
    let session = requestId ? sessionsByRequestId.get(requestId) : undefined;
    if (!session && cleanPhone) {
      session = verificationSessions.get(cleanPhone);
    }

    if (!session) {
      res.status(400).json({
        error: "Tasdiqlash sessiyasi topilmadi yoki muddati o'tgan. Iltimos, kodni qayta yuboring",
      });
      return;
    }

    // Limit to max 5 attempts
    if (session.attempts >= config.maxVerificationAttempts) {
      res.status(400).json({
        error: "Kodni kiritish urinishlari soni tugadi (5 ta). Iltimos, yangi kod so'rang",
      });
      return;
    }

    session.attempts += 1;

    console.log(
      `[TelegramGateway] Checking code '${cleanCode}' for requestId ${session.requestId} (attempt ${session.attempts}/${config.maxVerificationAttempts})...`
    );

    // Call real Telegram Gateway API checkVerificationStatus
    const checkResult = await telegramGateway.checkVerificationStatus(session.requestId, cleanCode);

    if (!checkResult.codeValid) {
      res.status(400).json({
        error: "Kod noto'g'ri",
        codeValid: false,
        attemptsLeft: Math.max(0, config.maxVerificationAttempts - session.attempts),
      });
      return;
    }

    // Verification successful! Clear session
    verificationSessions.delete(session.phone);
    sessionsByRequestId.delete(session.requestId);

    const userPhone = session.phone || cleanPhone;
    let user = db.users.find((u) => u.phone === userPhone);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = {
        id: `u-${Date.now()}`,
        phone: userPhone,
        ism: '',
        familiya: '',
        fullName: '',
        username: `user_${userPhone.slice(-4)}`,
        subscriptionStatus: 'premium',
        subscriptionUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      db.users.push(user);
    } else if (!user.ism || !user.familiya) {
      isNewUser = true;
    }

    // Generate JWT Access & Refresh tokens
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone, username: user.username },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwtRefreshSecret,
      { expiresIn: '90d' }
    );

    res.json({
      success: true,
      message: 'Muvaffaqiyatli tasdiqlandi',
      isNewUser,
      tokens: {
        accessToken,
        refreshToken,
      },
      user,
    });
  } catch (error: any) {
    console.error('[Auth Error /verify]:', error);
    res.status(500).json({ error: 'Tasdiqlashda xatolik yuz berdi' });
  }
});

// POST /auth/register-profile (Step 3: Ism and Familiya)
router.post('/register-profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ism, familiya, phone, role } = req.body;

    if (!ism || !familiya) {
      res.status(400).json({ error: 'Ism va familiya kiritilishi shart' });
      return;
    }

    let user: User | undefined;
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      user = db.users.find((u) => u.phone === cleanPhone);
    }

    if (!user) {
      user = db.users[0];
    }

    user.ism = ism.trim();
    user.familiya = familiya.trim();
    user.fullName = `${user.ism} ${user.familiya}`;
    user.username = ism.toLowerCase().replace(/[^a-z0-9]/g, '') || `master_${user.id.slice(-4)}`;
    if (role === 'CLIENT' || role === 'MASTER') {
      (user as any).role = role;
    }

    res.json({
      success: true,
      message: 'Profil saqlandi',
      user,
    });
  } catch (error) {
    res.status(500).json({ error: 'Profilni saqlashda xatolik' });
  }
});

// GET /auth/me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.json({ user: db.users[0] });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      const user = db.users.find((u) => u.id === decoded.userId) || db.users[0];
      res.json({ user });
    } catch (e) {
      res.json({ user: db.users[0] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
