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

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: "Avtorizatsiyadan o'tilmagan. Iltimos, tizimga kiring", code: 'UNAUTHORIZED' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      phone: string;
      role?: 'MASTER' | 'CLIENT';
    };

    req.user = decoded;

    // Verify user exists in database or provision from verified token
    let user = db.getUserById(decoded.userId);
    if (!user && decoded.phone) {
      user = {
        id: decoded.userId,
        phone: decoded.phone,
        ism: '',
        familiya: '',
        fullName: '',
        username: `user_${decoded.phone.slice(-4)}`,
        role: decoded.role || 'MASTER',
        createdAt: new Date().toISOString(),
      };
      db.createUser(user);
    }

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

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        userId: string;
        phone: string;
        role?: 'MASTER' | 'CLIENT';
      };
      req.user = decoded;
      req.currentUser = db.getUserById(decoded.userId) || undefined;
    } catch (e) {
      // ignore invalid token for optional endpoints
    }
  }
  next();
}
