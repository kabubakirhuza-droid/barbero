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
  status: 'confirmed' | 'cancelled' | 'completed';
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

export class Database {
  private isInitialized = false;

  public async query(text: string, params?: any[]): Promise<any> {
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
      const possiblePaths = [
        path.join(__dirname, 'schema.sql'),
        path.join(__dirname, '../src/schema.sql'),
        path.join(process.cwd(), 'src/schema.sql'),
        path.join(process.cwd(), 'backend/src/schema.sql'),
      ];
      const schemaPath = possiblePaths.find((p) => fs.existsSync(p));
      if (schemaPath) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('✅ [PostgreSQL] Database schema initialized and verified');
      }
      this.isInitialized = true;
    } catch (error: any) {
      console.warn('⚠️ [PostgreSQL] Schema init notice:', error.message);
      if (isProduction && !config.databaseUrl) {
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
        service.badgeColor || '#A67C2E',
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
      badgeColor: row.badge_color || '#A67C2E',
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

  public async createOrUpdateClient(userId: string, name: string, phone: string, spentDelta: number = 0): Promise<Client> {
    const existingRes = await this.query('SELECT * FROM clients WHERE user_id = $1 AND phone = $2 LIMIT 1', [userId, phone]);
    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      const newSpent = Number(existing.total_spent || 0) + spentDelta;
      const newVisits = Number(existing.visits_count || 0) + (spentDelta > 0 ? 1 : 0);
      const res = await this.query(
        `UPDATE clients SET name = $3, total_spent = $4, visits_count = $5, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
        [existing.id, userId, name || existing.name, newSpent, newVisits]
      );
      return this.mapClient(res.rows[0]);
    } else {
      const id = `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const res = await this.query(
        `INSERT INTO clients (id, user_id, name, phone, notes, total_spent, visits_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NULL, $5, $6, NOW(), NOW())
         RETURNING *`,
        [id, userId, name, phone, spentDelta, spentDelta > 0 ? 1 : 0]
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
  public async hasActiveSlotConflict(userId: string, date: string, startTime: string, excludeId?: string): Promise<boolean> {
    const query = excludeId
      ? "SELECT id FROM appointments WHERE user_id = $1 AND appointment_date = $2 AND start_time = $3 AND id != $4 AND status != 'cancelled' LIMIT 1"
      : "SELECT id FROM appointments WHERE user_id = $1 AND appointment_date = $2 AND start_time = $3 AND status != 'cancelled' LIMIT 1";
    const params = excludeId ? [userId, date, startTime, excludeId] : [userId, date, startTime];
    const res = await this.query(query, params);
    return res.rows.length > 0;
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
          apt.clientPhone,
          apt.serviceId,
          apt.serviceName,
          apt.servicePrice,
          apt.badgeColor || '#A67C2E',
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
      throw err;
    }
  }

  public async updateAppointment(id: string, userId: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    const existing = await this.getAppointmentById(id, userId);
    if (!existing) return null;

    const clientName = updates.clientName !== undefined ? updates.clientName : existing.clientName;
    const clientPhone = updates.clientPhone !== undefined ? updates.clientPhone : existing.clientPhone;
    const serviceId = updates.serviceId !== undefined ? updates.serviceId : existing.serviceId;
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
      badgeColor: row.badge_color || '#A67C2E',
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
        req.badgeColor || '#A67C2E',
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
      badgeColor: row.badge_color || '#A67C2E',
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
}

export const db = new Database();
