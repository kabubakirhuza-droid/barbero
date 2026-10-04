import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db, User } from '../db';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    phone: string;
    role?: 'MASTER' | 'CLIENT';
  };
  currentUser?: User;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: "Avtorizatsiyadan o'tilmagan. Iltimos, tizimga kiring", code: 'UNAUTHORIZED' });
    return;
  }

  if (!config.jwtSecret) {
    res.status(503).json({ error: "Xizmat vaqtincha sozlanmagan (JWT_SECRET missing)", code: 'SERVER_CONFIG_ERROR' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      phone: string;
      role?: 'MASTER' | 'CLIENT';
    };

    req.user = decoded;

    // Verify user exists in database
    const user = await db.getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: "Foydalanuvchi topilmadi yoki sessiya eskirgan", code: 'USER_NOT_FOUND' });
      return;
    }

    req.currentUser = user;
    next();
  } catch (err: any) {
    res.status(401).json({ error: "Yaroqsiz yoki muddati o'tgan token", code: 'INVALID_TOKEN' });
  }
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token && config.jwtSecret) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        userId: string;
        phone: string;
        role?: 'MASTER' | 'CLIENT';
      };
      req.user = decoded;
      req.currentUser = (await db.getUserById(decoded.userId)) || undefined;
    } catch (e) {
      // ignore invalid token for optional endpoints
    }
  }
  next();
}
