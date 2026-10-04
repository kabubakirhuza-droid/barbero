import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db, User } from '../db';
import { telegramGateway } from '../telegramGateway';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to normalize Uzbekistan phone number to standard format +998XXXXXXXXX
function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 9) {
    digits = `998${digits}`;
  }
  return `+${digits}`;
}

// POST /auth/send-code
router.post('/send-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Telefon raqam kiritilishi shart' });
      return;
    }

    const cleanPhone = normalizePhone(phone);
    if (!/^\+998\d{9}$/.test(cleanPhone)) {
      res.status(400).json({ error: "Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak (masalan, +998901234567)" });
      return;
    }

    // Persistent rate limit check: 1 send per 60 seconds
    const existing = await db.getOtpSession(cleanPhone);
    const now = Date.now();
    if (existing && now - existing.lastSentAt < config.rateLimitSeconds * 1000) {
      const remainingSeconds = Math.ceil((config.rateLimitSeconds * 1000 - (now - existing.lastSentAt)) / 1000);
      res.status(429).json({
        error: `Iltimos, qayta yuborishdan oldin ${remainingSeconds} soniya kuting`,
        retryAfter: remainingSeconds,
      });
      return;
    }

    // Call real Telegram Gateway API
    const result = await telegramGateway.sendVerificationMessage(cleanPhone);

    if (!result.success || !result.requestId) {
      res.status(400).json({
        error: result.error || "Telegram orqali kod yuborishda xatolik yuz berdi",
      });
      return;
    }

    // Save session persistently in DB
    await db.saveOtpSession(cleanPhone, result.requestId);

    res.json({
      success: true,
      message: 'Tasdiqlash kodi telefoningizga yuborildi',
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

    const cleanPhone = phone ? normalizePhone(phone) : '';
    let session = cleanPhone ? await db.getOtpSession(cleanPhone) : null;
    if (!session && requestId) {
      session = await db.getOtpSessionByRequestId(requestId);
    }

    if (!session) {
      res.status(400).json({
        error: "Tasdiqlash sessiyasi topilmadi yoki muddati o'tgan. Iltimos, kodni qayta yuboring",
      });
      return;
    }

    // Limit to max 5 attempts
    if (session.attempts >= config.maxVerificationAttempts) {
      res.status(429).json({
        error: "Kodni kiritish urinishlari soni tugadi (5 ta). Iltimos, yangi kod so'rang",
      });
      return;
    }

    // Strictly verify via Telegram Gateway API
    const checkResult = await telegramGateway.checkVerificationStatus(session.requestId, cleanCode);

    if (!checkResult.codeValid) {
      const attempts = await db.incrementOtpAttempts(session.phone);
      const remainingAttempts = Math.max(0, config.maxVerificationAttempts - attempts);
      res.status(400).json({
        error: "Kiritilgan kod noto'g'ri",
        codeValid: false,
        attemptsLeft: remainingAttempts,
      });
      return;
    }

    // Verification successful! Clear session
    await db.deleteOtpSession(session.phone);

    const userPhone = session.phone;
    let user = await db.getUserByPhone(userPhone);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await db.createUser({
        id: `u-${Date.now()}`,
        phone: userPhone,
        ism: '',
        familiya: '',
        fullName: '',
        username: `user_${userPhone.slice(-4)}`,
        role: 'MASTER',
        createdAt: new Date().toISOString(),
      });
    } else if (!user.ism || !user.familiya) {
      isNewUser = true;
    }

    // Generate real JWT Access & Refresh tokens
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone, username: user.username, role: user.role },
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

// POST /auth/register-profile (Protected: requires valid token)
router.post('/register-profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ism, familiya, role } = req.body;

    if (!ism || !familiya) {
      res.status(400).json({ error: 'Ism va familiya kiritilishi shart' });
      return;
    }

    const userId = req.user!.userId;
    const cleanIsm = String(ism).trim();
    const cleanFamiliya = String(familiya).trim();
    const fullName = `${cleanIsm} ${cleanFamiliya}`;
    const username = cleanIsm.toLowerCase().replace(/[^a-z0-9]/g, '') || `master_${userId.slice(-4)}`;

    const updatedUser = await db.updateUser(userId, {
      ism: cleanIsm,
      familiya: cleanFamiliya,
      fullName,
      username,
      role: role === 'CLIENT' || role === 'MASTER' ? role : undefined,
    });

    if (!updatedUser) {
      res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      return;
    }

    res.json({
      success: true,
      message: 'Profil muvaffaqiyatli saqlandi',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: 'Profilni saqlashda xatolik yuz berdi' });
  }
});

// GET /auth/me (Protected: requires valid token, returns 401 if missing)
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ error: "Avtorizatsiyadan o'tilmagan" });
      return;
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server xatoligi yuz berdi' });
  }
});

export default router;
