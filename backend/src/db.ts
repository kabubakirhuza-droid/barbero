import { Pool, PoolConfig } from 'pg';
import { config, isProduction } from './config';
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  phone: string;
  ism: string;
  familiya: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: 'MASTER' | 'CLIENT';
  createdAt?: string;
}

export interface OtpRequest {
  phone: string;
  requestId: string;
  attempts: number;
  lastSentAt: string; // ISO or date string
  createdAt: string;
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  createdBy?: string;
  createdAt?: string;
  memberCount?: number;
}

export interface SalonMember {
  id: string;
  salonId: string;
  masterId: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface Service {
  id: string;
  userId: string;
  name: string;
  price: number;
  duration: number; // minutes
  badgeColor: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  phone: string;
  notes?: string;
  totalSpent: number;
  visitsCount: number;
}

export interface BookingRequest {
  id: string;
  masterId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  badgeColor?: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  badgeColor: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "14:00"
  endTime: string; // "14:30"
  duration: number; // minutes
  status: 'confirmed' | 'arrived' | 'done' | 'completed' | 'no_show' | 'cancelled';
  createdAt?: string;
}

export interface WorkingDay {
  dayOfWeek: string;
  dayIndex: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchEnd: string;
}

export interface PortfolioPhoto {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  isPublic: boolean;
  createdAt?: string;
}

export interface UserSettings {
  bookingLinkActive: boolean;
  allowCustomTimeRequest: boolean;
  allowLunchTimeBooking: boolean;
  dailyReminderActive: boolean;
  dailyReminderTime: string;
  clientSmsReminderActive: boolean;
  appLanguage: string;
  securityPin?: string;
  biometricsEnabled: boolean;
}

export interface PushSubscriptionItem {
  id?: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  device?: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  masterId: string;
  clientName: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface BlockedSlot {
  id: string;
  userId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt?: string;
}

export interface CallLogItem {
  id: string;
  userId: string;
  phone: string;
  name: string;
  direction: 'outgoing_call' | 'incoming_manual' | 'booking_request' | 'appointment';
  isClient?: boolean;
  createdAt: string;
}

export interface LegalDocument {
  slug: string;
  titleUz: string;
  titleRu: string;
  bodyUz: string;
  bodyRu: string;
  version: string;
  publishedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  readAt?: string;
  createdAt: string;
}

// PostgreSQL Connection Pool Setup
const poolConfig: PoolConfig = {
  connectionString: config.databaseUrl || 'postgresql://postgres:postgres@localhost:5432/barbero_db',
  max: process.env.VERCEL ? 3 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
  ssl: isProduction && config.databaseUrl ? { rejectUnauthorized: false } : undefined,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client:', err);
});

export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = String(timeStr || '00:00').split(':').map(Number);
  const total = (h || 0) * 60 + (m || 0) + minutes;
  const endHours = Math.floor(total / 60) % 24;
  const endMins = total % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}

export function getTashkentNow(): { dateStr: string; timeStr: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';
  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hour}:${minute}`,
  };
}

export function normalizeUzbekPhone(raw: string): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 9) {
    digits = `998${digits}`;
  }
  return digits ? `+${digits}` : '';
}

export class Database {
  private isInitialized = false;
  private initError: Error | null = null;

  public async query(text: string, params?: any[]): Promise<any> {
    if (this.initError) {
      const err: any = new Error(`Database initialization failed: ${this.initError.message}`);
      err.status = 503;
      throw err;
    }
    if (!config.databaseUrl && isProduction) {
      const err: any = new Error('DATABASE_URL is not configured in production');
      err.status = 503;
      throw err;
    }
    return pool.query(text, params);
  }

  public async initDb(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const schemaSql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          phone VARCHAR(20) NOT NULL UNIQUE,
          ism VARCHAR(60) DEFAULT 'Master',
          familiya VARCHAR(60) DEFAULT 'Barbero',
          full_name VARCHAR(120) DEFAULT 'Barbero Master',
          username VARCHAR(50) UNIQUE,
          avatar_url TEXT,
          bio TEXT,
          role VARCHAR(20) DEFAULT 'MASTER',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS otp_requests (
          phone VARCHAR(20) PRIMARY KEY,
          request_id VARCHAR(100) NOT NULL,
          attempts INTEGER DEFAULT 0,
          last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS salons (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          address TEXT NOT NULL,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS salon_members (
          id VARCHAR(64) PRIMARY KEY,
          salon_id VARCHAR(64) REFERENCES salons(id) ON DELETE CASCADE,
          master_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(20) DEFAULT 'member',
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(salon_id, master_id)
        );
        CREATE TABLE IF NOT EXISTS services (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(120) NOT NULL,
          price INTEGER NOT NULL,
          duration INTEGER NOT NULL DEFAULT 30,
          badge_color VARCHAR(30) DEFAULT '#2563EB',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS clients (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          notes TEXT,
          total_spent INTEGER DEFAULT 0,
          visits_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS appointments (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          client_id VARCHAR(64) REFERENCES clients(id) ON DELETE SET NULL,
          client_name VARCHAR(100) NOT NULL,
          client_phone VARCHAR(20) DEFAULT '',
          service_id VARCHAR(64),
          service_name VARCHAR(120) NOT NULL,
          service_price INTEGER NOT NULL,
          badge_color VARCHAR(30) DEFAULT '#2563EB',
          appointment_date VARCHAR(20) NOT NULL,
          start_time VARCHAR(10) NOT NULL,
          end_time VARCHAR(10) NOT NULL,
          duration INTEGER NOT NULL DEFAULT 30,
          status VARCHAR(20) DEFAULT 'confirmed',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments (user_id, appointment_date);

        CREATE TABLE IF NOT EXISTS booking_requests (
          id VARCHAR(64) PRIMARY KEY,
          master_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          client_name VARCHAR(100) NOT NULL,
          client_phone VARCHAR(20) NOT NULL,
          service_id VARCHAR(64) REFERENCES services(id) ON DELETE SET NULL,
          service_name VARCHAR(120),
          service_price INTEGER,
          badge_color VARCHAR(30),
          appointment_date VARCHAR(20) NOT NULL,
          start_time VARCHAR(10) NOT NULL,
          duration INTEGER DEFAULT 30,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS working_hours (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          day_of_week VARCHAR(20) NOT NULL,
          day_index INTEGER NOT NULL,
          is_working BOOLEAN DEFAULT TRUE,
          start_time VARCHAR(10) DEFAULT '09:00',
          end_time VARCHAR(10) DEFAULT '21:00',
          lunch_start VARCHAR(10) DEFAULT '13:00',
          lunch_end VARCHAR(10) DEFAULT '14:00',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS portfolio_photos (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          caption VARCHAR(255),
          likes_count INTEGER DEFAULT 0,
          is_public BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          booking_link_active BOOLEAN DEFAULT TRUE,
          allow_custom_time_request BOOLEAN DEFAULT FALSE,
          allow_lunch_time_booking BOOLEAN DEFAULT FALSE,
          daily_reminder_active BOOLEAN DEFAULT TRUE,
          daily_reminder_time VARCHAR(10) DEFAULT '09:00',
          client_sms_reminder_active BOOLEAN DEFAULT TRUE,
          theme VARCHAR(20) DEFAULT 'system',
          app_language VARCHAR(10) DEFAULT 'uz',
          security_pin VARCHAR(4),
          biometrics_enabled BOOLEAN DEFAULT FALSE
        );
        CREATE TABLE IF NOT EXISTS blocked_slots (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          appointment_date VARCHAR(20) NOT NULL,
          start_time VARCHAR(10) NOT NULL,
          end_time VARCHAR(10) NOT NULL,
          reason VARCHAR(255) DEFAULT 'Dam olish',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_blocked_slots_user_date ON blocked_slots (user_id, appointment_date);

        CREATE TABLE IF NOT EXISTS call_log (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          phone VARCHAR(20) NOT NULL,
          name VARCHAR(100) DEFAULT '',
          direction VARCHAR(30) DEFAULT 'outgoing_call',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_call_log_user_created ON call_log (user_id, created_at DESC);

        CREATE TABLE IF NOT EXISTS legal_documents (
          slug VARCHAR(100) PRIMARY KEY,
          title_uz VARCHAR(255) NOT NULL,
          title_ru VARCHAR(255) NOT NULL,
          body_uz TEXT NOT NULL,
          body_ru TEXT NOT NULL,
          version VARCHAR(20) NOT NULL DEFAULT '1.0',
          published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS legal_acceptances (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          slug VARCHAR(100) REFERENCES legal_documents(slug) ON DELETE CASCADE,
          version VARCHAR(20) NOT NULL,
          accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          body TEXT NOT NULL,
          data JSONB DEFAULT '{}',
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);

        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          device VARCHAR(150),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS reviews (
          id VARCHAR(64) PRIMARY KEY,
          master_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          client_name VARCHAR(100) NOT NULL,
          rating INTEGER NOT NULL DEFAULT 5,
          comment TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      try {
        await pool.query('SELECT pg_advisory_lock(8472910)');
        await pool.query(schemaSql);
        
        // Seed default legal documents if not present
        await pool.query(`
          INSERT INTO legal_documents (slug, title_uz, title_ru, body_uz, body_ru, version, published_at)
          VALUES
            (
              'oferta',
              'Ommaviy oferta',
              'Публичная оферта',
              'Barbero xizmatidan foydalanish bo''yicha ommaviy oferta shartlari. Ushbu hujjat xizmat ko''rsatuvchi va foydalanuvchi o''rtasidagi huquqiy munosabatlarni tartibga soladi.',
              'Условия публичной оферты по использованию сервиса Barbero. Настоящий документ регулирует правоотношения между сервисом и пользователем.',
              '1.0',
              NOW()
            ),
            (
              'maxfiylik',
              'Maxfiylik siyosati',
              'Политика конфиденциальности',
              'Barbero foydalanuvchilarining shaxsiy ma''lumotlarini himoya qilish va qayta ishlash siyosati.',
              'Политика защиты и обработки персональных данных пользователей Barbero.',
              '1.0',
              NOW()
            ),
            (
              'mijozlar-maxfiylik',
              'Mijozlar uchun maxfiylik siyosati',
              'Политика конфиденциальности для клиентов',
              'Mijozlar yozuvlari va telefon raqamlari xavfsizligini ta''minlash shartlari.',
              'Условия обеспечения безопасности записей и номеров телефонов клиентов.',
              '1.0',
              NOW()
            )
          ON CONFLICT (slug) DO NOTHING;
        `);
      } finally {
        await pool.query('SELECT pg_advisory_unlock(8472910)').catch(() => {});
      }

      this.isInitialized = true;
      this.initError = null;
      console.log('✅ [PostgreSQL] Database schema initialized and verified');
    } catch (error: any) {
      console.warn('⚠️ [PostgreSQL] Schema init notice:', error.message);
      this.initError = error;
      if (isProduction) {
        throw error;
      }
    }
  }
  // --- Users ---
  public async getUserById(id: string): Promise<User | null> {
    const res = await this.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapUser(res.rows[0]);
  }

  public async getUserByPhone(phone: string): Promise<User | null> {
    const res = await this.query('SELECT * FROM users WHERE phone = $1 LIMIT 1', [phone]);
    if (res.rows.length === 0) return null;
    return this.mapUser(res.rows[0]);
  }

  public async getUserByUsername(username: string): Promise<User | null> {
    const res = await this.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [username]);
    if (res.rows.length === 0) return null;
    return this.mapUser(res.rows[0]);
  }

  public async createUser(user: User): Promise<User> {
    const fullName = user.fullName || `${user.ism || ''} ${user.familiya || ''}`.trim() || 'Barbero Foydalanuvchi';
    let finalUsername = user.username || `user_${user.phone.slice(-4)}`;
    try {
      const taken = await this.query('SELECT id FROM users WHERE username = $1 AND id != $2 LIMIT 1', [finalUsername, user.id]);
      if (taken.rows.length > 0) {
        finalUsername = `${finalUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }
    } catch (_) {}

    const res = await this.query(
      `INSERT INTO users (id, phone, ism, familiya, full_name, username, avatar_url, bio, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         phone = EXCLUDED.phone,
         ism = EXCLUDED.ism,
         familiya = EXCLUDED.familiya,
         full_name = EXCLUDED.full_name,
         username = EXCLUDED.username,
         role = EXCLUDED.role,
         updated_at = NOW()
       RETURNING *`,
      [
        user.id,
        user.phone,
        user.ism || '',
        user.familiya || '',
        fullName,
        finalUsername,
        user.avatarUrl || null,
        user.bio || null,
        user.role || 'MASTER',
      ]
    );

    // Auto-seed 5 default services for new master
    if (user.role === 'MASTER') {
      try {
        const srvCheck = await this.query('SELECT id FROM services WHERE user_id = $1 LIMIT 1', [user.id]);
        if (srvCheck.rows.length === 0) {
          const defaultServices = [
            { name: 'Soch olish', price: 50000, color: '#2563EB' },
            { name: 'Soch + soqol', price: 70000, color: '#2563EB' },
            { name: 'Bolalar sochi', price: 30000, color: '#10B981' },
            { name: 'Soqol olish', price: 30000, color: '#F59E0B' },
            { name: 'Kreativ soqol tekislash', price: 45000, color: '#8B5CF6' },
          ];
          for (let i = 0; i < defaultServices.length; i++) {
            const s = defaultServices[i];
            await this.query(
              `INSERT INTO services (id, user_id, name, price, duration, badge_color, is_active, created_at, updated_at)
               VALUES ($1, $2, $3, $4, 30, $5, TRUE, NOW(), NOW())
               ON CONFLICT (id) DO NOTHING`,
              [`srv-${user.id}-${i + 1}`, user.id, s.name, s.price, s.color]
            );
          }
        }
      } catch (_) {}
    }

    return this.mapUser(res.rows[0]);
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const existing = await this.getUserById(id);
    if (!existing) return null;

    const ism = updates.ism !== undefined ? updates.ism : existing.ism;
    const familiya = updates.familiya !== undefined ? updates.familiya : existing.familiya;
    const fullName = updates.fullName !== undefined ? updates.fullName : `${ism} ${familiya}`.trim();
    let username = updates.username !== undefined ? updates.username : existing.username;
    const role = updates.role !== undefined ? updates.role : existing.role;
    const avatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : existing.avatarUrl;
    const bio = updates.bio !== undefined ? updates.bio : existing.bio;

    if (updates.username && updates.username !== existing.username) {
      try {
        const taken = await this.query('SELECT id FROM users WHERE username = $1 AND id != $2 LIMIT 1', [updates.username, id]);
        if (taken.rows.length > 0) {
          username = `${updates.username}_${Math.floor(1000 + Math.random() * 9000)}`;
        }
      } catch (_) {}
    }

    const res = await this.query(
      `UPDATE users
       SET ism = $2, familiya = $3, full_name = $4, username = $5, role = $6, avatar_url = $7, bio = $8, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, ism, familiya, fullName, username, role, avatarUrl || null, bio || null]
    );
    if (res.rows.length === 0) return null;
    return this.mapUser(res.rows[0]);
  }

  private mapUser(row: any): User {
    return {
      id: row.id,
      phone: row.phone,
      ism: row.ism || '',
      familiya: row.familiya || '',
      fullName: row.full_name || `${row.ism || ''} ${row.familiya || ''}`.trim(),
      username: row.username || '',
      avatarUrl: row.avatar_url || undefined,
      bio: row.bio || undefined,
      role: (row.role as 'MASTER' | 'CLIENT') || 'MASTER',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };
  }

  // --- OTP Requests (Persistent SQL Table) ---
  public async getOtpRequest(phone: string): Promise<OtpRequest | null> {
    const res = await this.query('SELECT * FROM otp_requests WHERE phone = $1 LIMIT 1', [phone]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      phone: r.phone,
      requestId: r.request_id,
      attempts: r.attempts || 0,
      lastSentAt: r.last_sent_at ? new Date(r.last_sent_at).toISOString() : new Date().toISOString(),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    };
  }

  public async getOtpSession(phone: string): Promise<{ phone: string; requestId: string; attempts: number; lastSentAt: number } | null> {
    const req = await this.getOtpRequest(phone);
    if (!req) return null;
    return {
      phone: req.phone,
      requestId: req.requestId,
      attempts: req.attempts,
      lastSentAt: new Date(req.lastSentAt).getTime(),
    };
  }

  public async getOtpSessionByRequestId(requestId: string): Promise<{ phone: string; requestId: string; attempts: number; lastSentAt: number } | null> {
    const res = await this.query('SELECT * FROM otp_requests WHERE request_id = $1 LIMIT 1', [requestId]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      phone: r.phone,
      requestId: r.request_id,
      attempts: r.attempts || 0,
      lastSentAt: new Date(r.last_sent_at).getTime(),
    };
  }

  public async saveOtpRequest(phone: string, requestId: string): Promise<void> {
    await this.query(
      `INSERT INTO otp_requests (phone, request_id, attempts, last_sent_at, created_at)
       VALUES ($1, $2, 0, NOW(), NOW())
       ON CONFLICT (phone) DO UPDATE SET
         request_id = EXCLUDED.request_id,
         attempts = 0,
         last_sent_at = NOW()`,
      [phone, requestId]
    );
  }

  public async saveOtpSession(phone: string, requestId: string): Promise<void> {
    await this.saveOtpRequest(phone, requestId);
  }

  public async incrementOtpAttempts(phone: string): Promise<number> {
    const res = await this.query(
      `UPDATE otp_requests SET attempts = attempts + 1 WHERE phone = $1 RETURNING attempts`,
      [phone]
    );
    if (res.rows.length === 0) return 1;
    return res.rows[0].attempts;
  }

  public async deleteOtpRequest(phone: string): Promise<void> {
    await this.query('DELETE FROM otp_requests WHERE phone = $1', [phone]);
  }

  public async deleteOtpSession(phone: string): Promise<void> {
    await this.deleteOtpRequest(phone);
  }

  // --- Services ---
  public async getServices(userId: string): Promise<Service[]> {
    const res = await this.query(
      'SELECT * FROM services WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at ASC',
      [userId]
    );
    return res.rows.map(this.mapService);
  }

  public async getServiceById(id: string, userId?: string): Promise<Service | null> {
    const query = userId
      ? 'SELECT * FROM services WHERE id = $1 AND user_id = $2 LIMIT 1'
      : 'SELECT * FROM services WHERE id = $1 LIMIT 1';
    const params = userId ? [id, userId] : [id];
    const res = await this.query(query, params);
    if (res.rows.length === 0) return null;
    return this.mapService(res.rows[0]);
  }

  public async createService(service: Service): Promise<Service> {
    const res = await this.query(
      `INSERT INTO services (id, user_id, name, price, duration, badge_color, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        service.id,
        service.userId,
        service.name,
        service.price,
        service.duration || 30,
        service.badgeColor || '#2563EB',
        service.isActive !== false,
      ]
    );
    return this.mapService(res.rows[0]);
  }

  public async updateService(id: string, userId: string, updates: Partial<Service>): Promise<Service | null> {
    const existing = await this.getServiceById(id, userId);
    if (!existing) return null;

    const name = updates.name !== undefined ? updates.name : existing.name;
    const price = updates.price !== undefined ? updates.price : existing.price;
    const duration = updates.duration !== undefined ? updates.duration : existing.duration;
    const badgeColor = updates.badgeColor !== undefined ? updates.badgeColor : existing.badgeColor;
    const isActive = updates.isActive !== undefined ? updates.isActive : existing.isActive;

    const res = await this.query(
      `UPDATE services
       SET name = $3, price = $4, duration = $5, badge_color = $6, is_active = $7, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, name, price, duration, badgeColor, isActive]
    );
    if (res.rows.length === 0) return null;
    return this.mapService(res.rows[0]);
  }

  public async deleteService(id: string, userId: string): Promise<boolean> {
    const res = await this.query('DELETE FROM services WHERE id = $1 AND user_id = $2', [id, userId]);
    return (res.rowCount || 0) > 0;
  }

  private mapService(row: any): Service {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      price: Number(row.price),
      duration: Number(row.duration || 30),
      badgeColor: row.badge_color || '#2563EB',
      isActive: Boolean(row.is_active),
    };
  }

  // --- Clients ---
  public async getClients(userId: string): Promise<Client[]> {
    const res = await this.query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return res.rows.map(this.mapClient);
  }

  public async getClientById(id: string, userId: string): Promise<Client | null> {
    const res = await this.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2 LIMIT 1',
      [id, userId]
    );
    if (res.rows.length === 0) return null;
    return this.mapClient(res.rows[0]);
  }

  public async createClient(client: Client): Promise<Client> {
    const res = await this.query(
      `INSERT INTO clients (id, user_id, name, phone, notes, total_spent, visits_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING *`,
      [
        client.id,
        client.userId,
        client.name,
        client.phone,
        client.notes || null,
        client.totalSpent || 0,
        client.visitsCount || 0,
      ]
    );
    return this.mapClient(res.rows[0]);
  }

  public async updateClient(id: string, userId: string, updates: Partial<Client>): Promise<Client | null> {
    const existing = await this.getClientById(id, userId);
    if (!existing) return null;

    const name = updates.name !== undefined ? updates.name : existing.name;
    const phone = updates.phone !== undefined ? updates.phone : existing.phone;
    const notes = updates.notes !== undefined ? updates.notes : existing.notes;
    const totalSpent = updates.totalSpent !== undefined ? updates.totalSpent : existing.totalSpent;
    const visitsCount = updates.visitsCount !== undefined ? updates.visitsCount : existing.visitsCount;

    const res = await this.query(
      `UPDATE clients
       SET name = $3, phone = $4, notes = $5, total_spent = $6, visits_count = $7, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, name, phone, notes || null, totalSpent, visitsCount]
    );
    if (res.rows.length === 0) return null;
    return this.mapClient(res.rows[0]);
  }

  public async deleteClient(id: string, userId: string): Promise<boolean> {
    const res = await this.query('DELETE FROM clients WHERE id = $1 AND user_id = $2', [id, userId]);
    return (res.rowCount || 0) > 0;
  }

  public async searchClientByPhone(userId: string, rawPhone: string): Promise<{
    found: boolean;
    client?: Client & {
      avgSpend: number;
      lastVisit?: {
        date: string;
        startTime: string;
        serviceName: string;
        servicePrice: number;
        duration: number;
        status: string;
      };
    };
    normalizedPhone: string;
  }> {
    const normalizedPhone = normalizeUzbekPhone(rawPhone);
    const digits = normalizedPhone.replace(/\D/g, '');
    const last9 = digits.slice(-9);

    if (!last9) {
      return { found: false, normalizedPhone };
    }

    const res = await this.query(
      `SELECT * FROM clients 
       WHERE user_id = $1 AND (phone = $2 OR phone LIKE $3 OR phone = $4) 
       LIMIT 1`,
      [userId, normalizedPhone, `%${last9}`, last9]
    );

    if (res.rows.length === 0) {
      return { found: false, normalizedPhone };
    }

    const row = res.rows[0];
    const client = this.mapClient(row);
    const visits = client.visitsCount || 0;
    const avgSpend = visits > 0 ? Math.round((client.totalSpent || 0) / visits) : (client.totalSpent || 0);

    const lastAptRes = await this.query(
      `SELECT * FROM appointments 
       WHERE user_id = $1 AND (client_id = $2 OR client_phone = $3 OR client_phone LIKE $4) 
         AND status != 'cancelled' 
       ORDER BY appointment_date DESC, start_time DESC 
       LIMIT 1`,
      [userId, client.id, normalizedPhone, `%${last9}`]
    );

    let lastVisit;
    if (lastAptRes.rows.length > 0) {
      const apt = lastAptRes.rows[0];
      lastVisit = {
        date: apt.appointment_date,
        startTime: apt.start_time,
        serviceName: apt.service_name,
        servicePrice: Number(apt.service_price || 0),
        duration: Number(apt.duration || 30),
        status: apt.status,
      };
    }

    return {
      found: true,
      client: {
        ...client,
        avgSpend,
        lastVisit,
      },
      normalizedPhone,
    };
  }

  public async getClientHistory(userId: string, clientId: string): Promise<{
    client: Client | null;
    history: Array<{
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      serviceName: string;
      servicePrice: number;
      status: string;
      formattedSummary: string;
    }>;
  }> {
    const client = await this.getClientById(clientId, userId);
    if (!client) {
      return { client: null, history: [] };
    }

    const res = await this.query(
      `SELECT * FROM appointments 
       WHERE user_id = $1 AND (client_id = $2 OR client_phone = $3) 
       ORDER BY appointment_date DESC, start_time DESC`,
      [userId, clientId, client.phone]
    );

    const history = res.rows.map((r: any) => {
      const formattedPrice = Number(r.service_price || 0).toLocaleString('uz-UZ') + " so'm";
      return {
        id: r.id,
        date: r.appointment_date,
        startTime: r.start_time,
        endTime: r.end_time,
        serviceName: r.service_name,
        servicePrice: Number(r.service_price || 0),
        status: r.status,
        formattedSummary: `${r.appointment_date} — ${r.service_name} — ${formattedPrice}`,
      };
    });

    return { client, history };
  }

  public async createOrUpdateClient(userId: string, name: string, phone: string, spentDelta: number = 0, notes?: string): Promise<Client> {
    const normalizedPhone = normalizeUzbekPhone(phone) || phone;
    const digits = normalizedPhone.replace(/\D/g, '');
    const last9 = digits.slice(-9);

    const existingRes = await this.query(
      `SELECT * FROM clients WHERE user_id = $1 AND (phone = $2 OR phone LIKE $3 OR phone = $4) LIMIT 1`,
      [userId, normalizedPhone, `%${last9}`, last9]
    );

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      const newSpent = Number(existing.total_spent || 0) + spentDelta;
      const newVisits = Number(existing.visits_count || 0) + (spentDelta > 0 ? 1 : 0);
      const newNotes = notes !== undefined ? notes : existing.notes;
      const res = await this.query(
        `UPDATE clients SET name = $3, phone = $4, notes = $5, total_spent = $6, visits_count = $7, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
        [existing.id, userId, name || existing.name, normalizedPhone, newNotes || null, newSpent, newVisits]
      );
      return this.mapClient(res.rows[0]);
    } else {
      const id = `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const res = await this.query(
        `INSERT INTO clients (id, user_id, name, phone, notes, total_spent, visits_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [id, userId, name, normalizedPhone, notes || null, spentDelta, spentDelta > 0 ? 1 : 0]
      );
      return this.mapClient(res.rows[0]);
    }
  }

  private mapClient(row: any): Client {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      phone: row.phone,
      notes: row.notes || undefined,
      totalSpent: Number(row.total_spent || 0),
      visitsCount: Number(row.visits_count || 0),
    };
  }

  // --- Appointments ---
  public async hasActiveSlotConflict(
    userId: string,
    date: string,
    startTime: string,
    endTimeOrDurationOrExcludeId?: string | number,
    excludeId?: string
  ): Promise<boolean> {
    let endTime: string;
    let finalExcludeId = excludeId;

    if (typeof endTimeOrDurationOrExcludeId === 'number') {
      endTime = addMinutesToTime(startTime, endTimeOrDurationOrExcludeId);
    } else if (typeof endTimeOrDurationOrExcludeId === 'string') {
      if (endTimeOrDurationOrExcludeId.includes(':')) {
        endTime = endTimeOrDurationOrExcludeId;
      } else {
        finalExcludeId = endTimeOrDurationOrExcludeId;
        endTime = addMinutesToTime(startTime, 30);
      }
    } else {
      endTime = addMinutesToTime(startTime, 30);
    }

    // Overlap condition for intervals [A_start, A_end) and [B_start, B_end):
    // start_time < endTime AND end_time > startTime
    const aptQuery = finalExcludeId
      ? `SELECT id FROM appointments 
         WHERE user_id = $1 AND appointment_date = $2 
           AND start_time < $3 AND end_time > $4 
           AND id != $5 AND status != 'cancelled' LIMIT 1`
      : `SELECT id FROM appointments 
         WHERE user_id = $1 AND appointment_date = $2 
           AND start_time < $3 AND end_time > $4 
           AND status != 'cancelled' LIMIT 1`;
    const aptParams = finalExcludeId
      ? [userId, date, endTime, startTime, finalExcludeId]
      : [userId, date, endTime, startTime];
    const res = await this.query(aptQuery, aptParams);
    if (res.rows.length > 0) return true;

    // Also check blocked slots
    const blockedRes = await this.query(
      `SELECT id FROM blocked_slots 
       WHERE user_id = $1 AND appointment_date = $2 
         AND start_time < $3 AND end_time > $4 LIMIT 1`,
      [userId, date, endTime, startTime]
    );
    return blockedRes.rows.length > 0;
  }

  public async getAppointmentsByClientId(clientId: string, userId: string): Promise<Appointment[]> {
    const res = await this.query(
      'SELECT * FROM appointments WHERE user_id = $1 AND client_id = $2 ORDER BY appointment_date DESC, start_time DESC',
      [userId, clientId]
    );
    return res.rows.map(this.mapAppointment);
  }

  public async getAppointments(userId: string, date?: string): Promise<Appointment[]> {
    let query = 'SELECT * FROM appointments WHERE user_id = $1';
    const params: any[] = [userId];

    if (date) {
      query += ' AND appointment_date = $2';
      params.push(date);
    }

    query += " AND status != 'cancelled' ORDER BY appointment_date ASC, start_time ASC";
    const res = await this.query(query, params);
    return res.rows.map(this.mapAppointment);
  }

  public async getAllMasterAppointments(userId: string): Promise<Appointment[]> {
    const res = await this.query(
      'SELECT * FROM appointments WHERE user_id = $1 ORDER BY appointment_date ASC, start_time ASC',
      [userId]
    );
    return res.rows.map(this.mapAppointment);
  }

  public async getTodaySchedule(userId: string, targetDate?: string): Promise<{
    date: string;
    dayOfWeek: string;
    appointments: Appointment[];
    currentAppointment: Appointment | null;
    upcomingAppointments: Appointment[];
    freeSlots: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      status: 'FREE' | 'OCCUPIED' | 'BLOCKED' | 'CURRENT' | 'PAST';
      appointment?: Appointment;
    }>;
    stats: {
      totalClients: number;
      completedCount: number;
      totalRevenue: number;
      remainingCount: number;
    };
  }> {
    const { dateStr: todayStr, timeStr: nowTime } = getTashkentNow();
    const date = targetDate || todayStr;
    const isToday = date === todayStr;

    const appointments = await this.getAppointments(userId, date);
    const blockedSlots = await this.getBlockedSlots(userId, date);

    const workingHours = await this.getWorkingHours(userId);
    const dayDate = new Date(`${date}T12:00:00Z`);
    let jsDay = dayDate.getUTCDay();
    const dbDayIndex = jsDay === 0 ? 7 : jsDay;
    const todayWorkingDay = workingHours.find((w) => w.dayIndex === dbDayIndex) || {
      dayOfWeek: 'Bugun',
      dayIndex: dbDayIndex,
      isWorking: true,
      startTime: '09:00',
      endTime: '21:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
    };

    const slotStart = todayWorkingDay.isWorking ? (todayWorkingDay.startTime || '09:00') : '09:00';
    const slotEnd = todayWorkingDay.isWorking ? (todayWorkingDay.endTime || '21:00') : '21:00';

    const freeSlots: Array<{
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      status: 'FREE' | 'OCCUPIED' | 'BLOCKED' | 'CURRENT' | 'PAST';
      appointment?: Appointment;
    }> = [];

    let cur = slotStart;
    while (cur < slotEnd) {
      const next = addMinutesToTime(cur, 30);
      const matchedApt = appointments.find(
        (a) => a.status !== 'cancelled' && a.startTime < next && a.endTime > cur
      );
      const isBlocked = blockedSlots.some(
        (b) => b.startTime < next && b.endTime > cur
      );

      let status: 'FREE' | 'OCCUPIED' | 'BLOCKED' | 'CURRENT' | 'PAST' = 'FREE';
      let isAvailable = true;

      if (matchedApt) {
        status = 'OCCUPIED';
        isAvailable = false;
      } else if (isBlocked) {
        status = 'BLOCKED';
        isAvailable = false;
      } else if (isToday && next <= nowTime) {
        status = 'PAST';
        isAvailable = false;
      }

      if (isToday && cur <= nowTime && next > nowTime) {
        if (matchedApt) status = 'CURRENT';
      }

      freeSlots.push({
        startTime: cur,
        endTime: next,
        isAvailable,
        status,
        appointment: matchedApt,
      });

      cur = next;
    }

    let currentAppointment: Appointment | null = null;
    if (isToday) {
      currentAppointment = appointments.find(
        (a) => a.status !== 'cancelled' && a.startTime <= nowTime && a.endTime > nowTime
      ) || null;
    }

    const upcomingAppointments = appointments.filter((a) => {
      if (a.status === 'cancelled') return false;
      if (!isToday) return true;
      return a.startTime >= nowTime || (a.startTime <= nowTime && a.endTime > nowTime);
    });

    const completed = appointments.filter((a) => a.status === 'completed' || a.status === 'done');
    const valid = appointments.filter((a) => a.status !== 'cancelled' && a.status !== 'no_show');
    const totalRevenue = valid.reduce((sum, a) => sum + (Number(a.servicePrice) || 0), 0);

    return {
      date,
      dayOfWeek: todayWorkingDay.dayOfWeek,
      appointments,
      currentAppointment,
      upcomingAppointments,
      freeSlots,
      stats: {
        totalClients: valid.length,
        completedCount: completed.length,
        totalRevenue,
        remainingCount: upcomingAppointments.length,
      },
    };
  }

  public async getAppointmentById(id: string, userId?: string): Promise<Appointment | null> {
    const query = userId
      ? 'SELECT * FROM appointments WHERE id = $1 AND user_id = $2 LIMIT 1'
      : 'SELECT * FROM appointments WHERE id = $1 LIMIT 1';
    const params = userId ? [id, userId] : [id];
    const res = await this.query(query, params);
    if (res.rows.length === 0) return null;
    return this.mapAppointment(res.rows[0]);
  }

  public async createAppointment(apt: Appointment): Promise<Appointment> {
    try {
      // Validate serviceId exists or set to null to avoid foreign key failure
      let validServiceId = apt.serviceId || null;
      if (validServiceId) {
        try {
          const srvCheck = await this.query('SELECT id FROM services WHERE id = $1 LIMIT 1', [validServiceId]);
          if (srvCheck.rows.length === 0) {
            validServiceId = null;
          }
        } catch (_) {
          validServiceId = null;
        }
      }

      const res = await this.query(
        `INSERT INTO appointments (
           id, user_id, client_id, client_name, client_phone,
           service_id, service_name, service_price, badge_color,
           appointment_date, start_time, end_time, duration, status, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
         RETURNING *`,
        [
          apt.id,
          apt.userId,
          apt.clientId || null,
          apt.clientName,
          apt.clientPhone || '',
          validServiceId,
          apt.serviceName || 'Soch olish',
          apt.servicePrice || 50000,
          apt.badgeColor || '#2563EB',
          apt.date,
          apt.startTime,
          apt.endTime || apt.startTime,
          apt.duration || 30,
          apt.status || 'confirmed',
        ]
      );
      return this.mapAppointment(res.rows[0]);
    } catch (err: any) {
      // Catch unique index violation (idx_unique_active_slot) on PostgreSQL (error code 23505)
      if (err.code === '23505') {
        const error: any = new Error(`Ushbu vaqt oralig'i (${apt.date} ${apt.startTime}) allaqachon band qilingan`);
        error.status = 409;
        error.code = 'SLOT_OCCUPIED';
        throw error;
      }
      console.error('[DB createAppointment error]:', err);
      throw err;
    }
  }

  public async updateAppointment(id: string, userId: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    const existing = await this.getAppointmentById(id, userId);
    if (!existing) return null;

    const clientName = updates.clientName !== undefined ? updates.clientName : existing.clientName;
    const clientPhone = updates.clientPhone !== undefined ? updates.clientPhone : existing.clientPhone;
    let serviceId = updates.serviceId !== undefined ? updates.serviceId : existing.serviceId;
    if (serviceId) {
      try {
        const srvCheck = await this.query('SELECT id FROM services WHERE id = $1 LIMIT 1', [serviceId]);
        if (srvCheck.rows.length === 0) {
          serviceId = null as any;
        }
      } catch (_) {
        serviceId = null as any;
      }
    }
    const serviceName = updates.serviceName !== undefined ? updates.serviceName : existing.serviceName;
    const servicePrice = updates.servicePrice !== undefined ? updates.servicePrice : existing.servicePrice;
    const badgeColor = updates.badgeColor !== undefined ? updates.badgeColor : existing.badgeColor;
    const date = updates.date !== undefined ? updates.date : existing.date;
    const startTime = updates.startTime !== undefined ? updates.startTime : existing.startTime;
    const endTime = updates.endTime !== undefined ? updates.endTime : existing.endTime;
    const duration = updates.duration !== undefined ? updates.duration : existing.duration;
    const status = updates.status !== undefined ? updates.status : existing.status;

    try {
      const res = await this.query(
        `UPDATE appointments
         SET client_name = $3, client_phone = $4, service_id = $5, service_name = $6,
             service_price = $7, badge_color = $8, appointment_date = $9, start_time = $10,
             end_time = $11, duration = $12, status = $13, updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [
          id,
          userId,
          clientName,
          clientPhone,
          serviceId,
          serviceName,
          servicePrice,
          badgeColor,
          date,
          startTime,
          endTime,
          duration,
          status,
        ]
      );
      if (res.rows.length === 0) return null;
      return this.mapAppointment(res.rows[0]);
    } catch (err: any) {
      if (err.code === '23505') {
        const error: any = new Error(`Ushbu vaqt oralig'i (${date} ${startTime}) allaqachon band qilingan`);
        error.status = 409;
        error.code = 'SLOT_OCCUPIED';
        throw error;
      }
      throw err;
    }
  }

  public async deleteAppointment(id: string, userId: string): Promise<boolean> {
    // Mark as cancelled so slot becomes free via idx_unique_active_slot partial index
    const res = await this.query(
      "UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  private mapAppointment(row: any): Appointment {
    return {
      id: row.id,
      userId: row.user_id,
      clientId: row.client_id || undefined,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      serviceId: row.service_id,
      serviceName: row.service_name,
      servicePrice: Number(row.service_price),
      badgeColor: row.badge_color || '#2563EB',
      date: row.appointment_date,
      startTime: row.start_time,
      endTime: row.end_time || row.start_time,
      duration: Number(row.duration || 30),
      status: (row.status as 'confirmed' | 'cancelled' | 'completed') || 'confirmed',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };
  }

  // --- Booking Requests ---
  public async getBookingRequests(masterId: string): Promise<BookingRequest[]> {
    const res = await this.query(
      "SELECT * FROM booking_requests WHERE master_id = $1 AND status = 'pending' ORDER BY created_at DESC",
      [masterId]
    );
    return res.rows.map(this.mapBookingRequest);
  }

  public async getBookingRequestById(id: string): Promise<BookingRequest | null> {
    const res = await this.query('SELECT * FROM booking_requests WHERE id = $1 LIMIT 1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapBookingRequest(res.rows[0]);
  }

  public async createBookingRequest(req: BookingRequest): Promise<BookingRequest> {
    const res = await this.query(
      `INSERT INTO booking_requests (
         id, master_id, client_name, client_phone, service_id,
         service_name, service_price, badge_color, appointment_date,
         start_time, duration, status, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [
        req.id,
        req.masterId,
        req.clientName,
        req.clientPhone,
        req.serviceId,
        req.serviceName,
        req.servicePrice,
        req.badgeColor || '#2563EB',
        req.date,
        req.time,
        req.duration || 30,
        req.status || 'pending',
      ]
    );
    return this.mapBookingRequest(res.rows[0]);
  }

  public async updateBookingRequestStatus(id: string, status: 'accepted' | 'rejected' | 'pending'): Promise<BookingRequest | null> {
    const res = await this.query(
      'UPDATE booking_requests SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    if (res.rows.length === 0) return null;
    return this.mapBookingRequest(res.rows[0]);
  }

  private mapBookingRequest(row: any): BookingRequest {
    return {
      id: row.id,
      masterId: row.master_id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      serviceId: row.service_id,
      serviceName: row.service_name || '',
      servicePrice: Number(row.service_price || 0),
      badgeColor: row.badge_color || '#2563EB',
      date: row.appointment_date,
      time: row.start_time,
      duration: Number(row.duration || 30),
      status: row.status as 'pending' | 'accepted' | 'rejected' | 'expired',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };
  }

  // --- Salons & Spatial Math ---
  public async getAllSalons(): Promise<Salon[]> {
    const res = await this.query(`
      SELECT s.*, COUNT(sm.id)::int AS member_count
      FROM salons s
      LEFT JOIN salon_members sm ON s.id = sm.salon_id
      GROUP BY s.id
      ORDER BY s.name ASC
    `);
    return res.rows.map(this.mapSalon);
  }

  public async getNearbySalons(lat: number, lng: number, radiusMeters = 50): Promise<Salon[]> {
    // Use haversine formula in meters (compatible with both standard Postgres and PostGIS)
    const res = await this.query(
      `SELECT s.*, COUNT(sm.id)::int AS member_count,
              (6371000 * acos(
                cos(radians($1)) * cos(radians(s.latitude)) *
                cos(radians(s.longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(s.latitude))
              )) AS distance_meters
       FROM salons s
       LEFT JOIN salon_members sm ON s.id = sm.salon_id
       GROUP BY s.id
       HAVING (6371000 * acos(
                cos(radians($1)) * cos(radians(s.latitude)) *
                cos(radians(s.longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(s.latitude))
              )) <= $3
       ORDER BY distance_meters ASC`,
      [lat, lng, radiusMeters]
    );
    return res.rows.map(this.mapSalon);
  }

  public async getSalonById(id: string): Promise<Salon | null> {
    const res = await this.query(
      `SELECT s.*, COUNT(sm.id)::int AS member_count
       FROM salons s
       LEFT JOIN salon_members sm ON s.id = sm.salon_id
       WHERE s.id = $1
       GROUP BY s.id
       LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapSalon(res.rows[0]);
  }

  public async createSalon(salon: Salon): Promise<Salon> {
    const res = await this.query(
      `INSERT INTO salons (id, name, address, latitude, longitude, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [salon.id, salon.name, salon.address, salon.latitude, salon.longitude, salon.createdBy || null]
    );
    return this.mapSalon(res.rows[0]);
  }

  public async joinSalon(salonId: string, masterId: string, role = 'member'): Promise<SalonMember> {
    const id = `sm-${Date.now()}`;
    const res = await this.query(
      `INSERT INTO salon_members (id, salon_id, master_id, role, joined_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (salon_id, master_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [id, salonId, masterId, role]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      salonId: r.salon_id,
      masterId: r.master_id,
      role: r.role as 'owner' | 'member',
      joinedAt: r.joined_at ? new Date(r.joined_at).toISOString() : new Date().toISOString(),
    };
  }

  public async getSalonMembers(salonId: string): Promise<any[]> {
    const res = await this.query(
      `SELECT sm.*, u.ism, u.familiya, u.full_name, u.phone, u.username
       FROM salon_members sm
       JOIN users u ON sm.master_id = u.id
       WHERE sm.salon_id = $1
       ORDER BY sm.role DESC, sm.joined_at ASC`,
      [salonId]
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      salonId: r.salon_id,
      masterId: r.master_id,
      name: r.full_name || `${r.ism || ''} ${r.familiya || ''}`.trim() || 'Usta',
      phone: r.phone,
      username: r.username,
      role: r.role,
    }));
  }

  public async getMasterSalon(masterId: string): Promise<{ salon: Salon; members: any[] } | null> {
    const memberRes = await this.query(
      'SELECT salon_id FROM salon_members WHERE master_id = $1 LIMIT 1',
      [masterId]
    );
    if (memberRes.rows.length === 0) return null;

    const salonId = memberRes.rows[0].salon_id;
    const salon = await this.getSalonById(salonId);
    if (!salon) return null;

    const members = await this.getSalonMembers(salonId);
    return { salon, members };
  }

  private mapSalon(row: any): Salon {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      createdBy: row.created_by || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      memberCount: Number(row.member_count || 1),
    };
  }

  // --- Working Hours ---
  public async getWorkingHours(userId: string): Promise<WorkingDay[]> {
    const res = await this.query(
      'SELECT * FROM working_hours WHERE user_id = $1 ORDER BY day_index ASC',
      [userId]
    );
    if (res.rows.length > 0) {
      return res.rows.map((r: any) => ({
        dayOfWeek: r.day_of_week,
        dayIndex: r.day_index,
        isWorking: r.is_working,
        startTime: r.start_time,
        endTime: r.end_time,
        lunchStart: r.lunch_start,
        lunchEnd: r.lunch_end,
      }));
    }

    // Default working schedule (Monday to Saturday 09:00 - 21:00)
    return [
      { dayOfWeek: 'Dushanba', dayIndex: 1, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
      { dayOfWeek: 'Seshanba', dayIndex: 2, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
      { dayOfWeek: 'Chorshanba', dayIndex: 3, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
      { dayOfWeek: 'Payshanba', dayIndex: 4, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
      { dayOfWeek: 'Juma', dayIndex: 5, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
      { dayOfWeek: 'Shanba', dayIndex: 6, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
      { dayOfWeek: 'Yakshanba', dayIndex: 7, isWorking: false, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    ];
  }

  public async saveWorkingHours(userId: string, hours: WorkingDay[]): Promise<WorkingDay[]> {
    await this.query('DELETE FROM working_hours WHERE user_id = $1', [userId]);
    for (const h of hours) {
      await this.query(
        `INSERT INTO working_hours (id, user_id, day_of_week, day_index, is_working, start_time, end_time, lunch_start, lunch_end, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          `wh-${userId}-${h.dayIndex}`,
          userId,
          h.dayOfWeek,
          h.dayIndex,
          h.isWorking,
          h.startTime,
          h.endTime,
          h.lunchStart,
          h.lunchEnd,
        ]
      );
    }
    return this.getWorkingHours(userId);
  }

  public async updateWorkingHours(userId: string, hours: WorkingDay[]): Promise<WorkingDay[]> {
    return this.saveWorkingHours(userId, hours);
  }

  // --- User Settings ---
  public async getUserSettings(userId: string): Promise<UserSettings> {
    const res = await this.query('SELECT * FROM user_settings WHERE user_id = $1 LIMIT 1', [userId]);
    if (res.rows.length === 0) {
      return {
        bookingLinkActive: true,
        allowCustomTimeRequest: false,
        allowLunchTimeBooking: false,
        dailyReminderActive: true,
        dailyReminderTime: '09:00',
        clientSmsReminderActive: true,
        appLanguage: 'uz',
        biometricsEnabled: false,
      };
    }
    const r = res.rows[0];
    return {
      bookingLinkActive: Boolean(r.booking_link_active),
      allowCustomTimeRequest: Boolean(r.allow_custom_time_request),
      allowLunchTimeBooking: Boolean(r.allow_lunch_time_booking),
      dailyReminderActive: Boolean(r.daily_reminder_active),
      dailyReminderTime: r.daily_reminder_time || '09:00',
      clientSmsReminderActive: Boolean(r.client_sms_reminder_active),
      appLanguage: r.app_language || 'uz',
      securityPin: r.security_pin || undefined,
      biometricsEnabled: Boolean(r.biometrics_enabled),
    };
  }

  public async saveUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getUserSettings(userId);
    const updated: UserSettings = { ...current, ...settings };

    await this.query(
      `INSERT INTO user_settings (
         user_id, booking_link_active, allow_custom_time_request,
         allow_lunch_time_booking, daily_reminder_active, daily_reminder_time,
         client_sms_reminder_active, app_language, security_pin, biometrics_enabled
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
         booking_link_active = EXCLUDED.booking_link_active,
         allow_custom_time_request = EXCLUDED.allow_custom_time_request,
         allow_lunch_time_booking = EXCLUDED.allow_lunch_time_booking,
         daily_reminder_active = EXCLUDED.daily_reminder_active,
         daily_reminder_time = EXCLUDED.daily_reminder_time,
         client_sms_reminder_active = EXCLUDED.client_sms_reminder_active,
         app_language = EXCLUDED.app_language,
         security_pin = EXCLUDED.security_pin,
         biometrics_enabled = EXCLUDED.biometrics_enabled`,
      [
        userId,
        updated.bookingLinkActive,
        updated.allowCustomTimeRequest,
        updated.allowLunchTimeBooking,
        updated.dailyReminderActive,
        updated.dailyReminderTime,
        updated.clientSmsReminderActive,
        updated.appLanguage,
        updated.securityPin || null,
        updated.biometricsEnabled,
      ]
    );
    return updated;
  }

  public async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    return this.saveUserSettings(userId, settings);
  }

  // --- Portfolio Photos ---
  public async getPortfolioPhotos(userId?: string): Promise<PortfolioPhoto[]> {
    const query = userId
      ? 'SELECT * FROM portfolio_photos WHERE user_id = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM portfolio_photos WHERE is_public = TRUE ORDER BY created_at DESC';
    const params = userId ? [userId] : [];
    const res = await this.query(query, params);
    return res.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      imageUrl: r.image_url,
      caption: r.caption || '',
      likesCount: Number(r.likes_count || 0),
      isPublic: Boolean(r.is_public),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    }));
  }

  public async addPortfolioPhoto(photo: PortfolioPhoto): Promise<PortfolioPhoto> {
    const res = await this.query(
      `INSERT INTO portfolio_photos (id, user_id, image_url, caption, likes_count, is_public, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [photo.id, photo.userId, photo.imageUrl, photo.caption || '', photo.likesCount || 0, photo.isPublic !== false]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      imageUrl: r.image_url,
      caption: r.caption || '',
      likesCount: Number(r.likes_count || 0),
      isPublic: Boolean(r.is_public),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    };
  }

  public async likePortfolioPhoto(id: string): Promise<number> {
    const res = await this.query(
      'UPDATE portfolio_photos SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
      [id]
    );
    if (res.rows.length === 0) return 0;
    return Number(res.rows[0].likes_count);
  }

  public async deletePortfolioPhoto(id: string, userId: string): Promise<boolean> {
    const res = await this.query('DELETE FROM portfolio_photos WHERE id = $1 AND user_id = $2', [id, userId]);
    return (res.rowCount || 0) > 0;
  }

  // --- Push Subscriptions ---
  public async savePushSubscription(sub: PushSubscriptionItem): Promise<void> {
    const id = sub.id || `ps-${Date.now()}`;
    await this.query(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, device, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         device = EXCLUDED.device`,
      [id, sub.userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, sub.device || null]
    );
  }

  public async deletePushSubscription(endpoint: string): Promise<boolean> {
    const res = await this.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    return (res.rowCount || 0) > 0;
  }

  public async getPushSubscriptions(userId?: string): Promise<PushSubscriptionItem[]> {
    const query = userId
      ? 'SELECT * FROM push_subscriptions WHERE user_id = $1'
      : 'SELECT * FROM push_subscriptions';
    const params = userId ? [userId] : [];
    const res = await this.query(query, params);
    return res.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      endpoint: r.endpoint,
      keys: {
        p256dh: r.p256dh,
        auth: r.auth,
      },
      device: r.device || undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    }));
  }

  public async getInactiveClients(userId: string, daysThreshold: number = 21): Promise<any[]> {
    const query = `
      SELECT 
        c.*,
        MAX(a.appointment_date) as last_visit_date,
        COUNT(a.id) as total_appointments
      FROM clients c
      LEFT JOIN appointments a ON a.client_id = c.id AND a.user_id = c.user_id AND a.status != 'cancelled'
      WHERE c.user_id = $1
      GROUP BY c.id
      HAVING MAX(a.appointment_date) IS NULL OR MAX(a.appointment_date) < (CURRENT_DATE - INTERVAL '21 days')::text
      ORDER BY last_visit_date ASC NULLS FIRST
    `;
    const res = await this.query(query, [userId]);
    return res.rows.map((row: any) => ({
      ...this.mapClient(row),
      lastVisitDate: row.last_visit_date || null,
      totalAppointments: Number(row.total_appointments || 0),
    }));
  }

  // --- Reviews (Ratings & Feedback) ---
  public async getReviewsByMasterId(masterId: string): Promise<{ reviews: Review[]; avgRating: number; count: number }> {
    const res = await this.query(
      'SELECT * FROM reviews WHERE master_id = $1 ORDER BY created_at DESC',
      [masterId]
    );
    const reviews = res.rows.map((r: any) => this.mapReview(r));
    const count = reviews.length;
    const avgRating = count > 0 ? Number((reviews.reduce((s: number, r: Review) => s + r.rating, 0) / count).toFixed(1)) : 5.0;
    return { reviews, avgRating, count };
  }

  public async createReview(review: Review): Promise<Review> {
    const id = review.id || `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.query(
      `INSERT INTO reviews (id, master_id, client_name, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        id,
        review.masterId,
        review.clientName,
        Math.max(1, Math.min(5, Number(review.rating) || 5)),
        review.comment || null,
      ]
    );
    return this.mapReview(res.rows[0]);
  }

  private mapReview(row: any): Review {
    return {
      id: row.id,
      masterId: row.master_id,
      clientName: row.client_name,
      rating: Number(row.rating || 5),
      comment: row.comment || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    };
  }

  // --- Blocked Slots (Dam olish / Lunch Break) ---
  public async getBlockedSlots(userId: string, date?: string): Promise<BlockedSlot[]> {
    let query = 'SELECT * FROM blocked_slots WHERE user_id = $1';
    const params: any[] = [userId];
    if (date) {
      query += ' AND appointment_date = $2';
      params.push(date);
    }
    query += ' ORDER BY start_time ASC';
    const res = await this.query(query, params);
    return res.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      appointmentDate: r.appointment_date,
      startTime: r.start_time,
      endTime: r.end_time,
      reason: r.reason || 'Dam olish',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    }));
  }

  public async createBlockedSlot(slot: {
    id?: string;
    userId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }): Promise<BlockedSlot> {
    const id = slot.id || `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.query(
      `INSERT INTO blocked_slots (id, user_id, appointment_date, start_time, end_time, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        id,
        slot.userId,
        slot.appointmentDate,
        slot.startTime,
        slot.endTime || slot.startTime,
        slot.reason || 'Dam olish',
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      appointmentDate: r.appointment_date,
      startTime: r.start_time,
      endTime: r.end_time,
      reason: r.reason,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    };
  }

  public async deleteBlockedSlot(id: string, userId: string): Promise<boolean> {
    const res = await this.query(
      'DELETE FROM blocked_slots WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  // --- Call Log ---
  public async getCallLogs(userId: string, limit: number = 20): Promise<CallLogItem[]> {
    const query = `
      SELECT c.id, c.user_id, c.phone,
             COALESCE(NULLIF(c.name, ''), cl.name, 'Noma''lum') as name,
             c.direction, c.created_at,
             (cl.id IS NOT NULL) as is_client
      FROM (
        SELECT DISTINCT ON (phone) id, user_id, phone, name, direction, created_at
        FROM call_log
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
        ORDER BY phone, created_at DESC
      ) c
      LEFT JOIN clients cl ON cl.user_id = c.user_id AND cl.phone = c.phone
      ORDER BY c.created_at DESC
      LIMIT $2
    `;
    const res = await this.query(query, [userId, limit]);
    return res.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      phone: r.phone,
      name: r.name || "Noma'lum",
      direction: r.direction as any,
      isClient: Boolean(r.is_client),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  }

  public async addCallLog(
    userId: string,
    phone: string,
    name?: string,
    direction: 'outgoing_call' | 'incoming_manual' | 'booking_request' | 'appointment' = 'outgoing_call'
  ): Promise<CallLogItem> {
    const id = `cl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.query(
      `INSERT INTO call_log (id, user_id, phone, name, direction, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, userId, phone, name || '', direction]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      phone: r.phone,
      name: r.name || "Noma'lum",
      direction: r.direction as any,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    };
  }

  // --- Legal Documents ---
  public async getLegalDocuments(): Promise<LegalDocument[]> {
    const res = await this.query('SELECT * FROM legal_documents ORDER BY slug ASC');
    return res.rows.map((r: any) => ({
      slug: r.slug,
      titleUz: r.title_uz,
      titleRu: r.title_ru,
      bodyUz: r.body_uz,
      bodyRu: r.body_ru,
      version: r.version,
      publishedAt: r.published_at ? new Date(r.published_at).toISOString() : new Date().toISOString(),
    }));
  }

  public async getLegalDocument(slug: string): Promise<LegalDocument | null> {
    const res = await this.query('SELECT * FROM legal_documents WHERE slug = $1 LIMIT 1', [slug]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      slug: r.slug,
      titleUz: r.title_uz,
      titleRu: r.title_ru,
      bodyUz: r.body_uz,
      bodyRu: r.body_ru,
      version: r.version,
      publishedAt: r.published_at ? new Date(r.published_at).toISOString() : new Date().toISOString(),
    };
  }

  public async acceptLegalDocument(userId: string, slug: string, version: string): Promise<boolean> {
    const id = `la-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await this.query(
      `INSERT INTO legal_acceptances (id, user_id, slug, version, accepted_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [id, userId, slug, version]
    );
    return true;
  }

  // --- Notifications ---
  public async getNotifications(userId: string): Promise<NotificationItem[]> {
    const res = await this.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      body: r.body,
      data: r.data || {},
      readAt: r.read_at ? new Date(r.read_at).toISOString() : undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  }

  public async createNotification(notif: {
    id?: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }): Promise<NotificationItem> {
    const id = notif.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.query(
      `INSERT INTO notifications (id, user_id, type, title, body, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, notif.userId, notif.type, notif.title, notif.body, JSON.stringify(notif.data || {})]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      body: r.body,
      data: r.data || {},
      readAt: undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    };
  }

  public async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const res = await this.query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  public async markAllNotificationsRead(userId: string): Promise<boolean> {
    const res = await this.query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );
    return (res.rowCount || 0) > 0;
  }

  // --- Auto-expire Booking Requests (called on request check) ---
  public async expirePendingBookingRequests(ttlMinutes: number = 30): Promise<number> {
    try {
      const res = await this.query(
        `UPDATE booking_requests
         SET status = 'expired'
         WHERE status = 'pending'
           AND created_at < NOW() - ($1 || ' minutes')::INTERVAL`,
        [ttlMinutes]
      );
      return res.rowCount || 0;
    } catch (_) {
      return 0;
    }
  }
}

export const db = new Database();

