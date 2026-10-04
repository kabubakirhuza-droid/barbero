import { Pool } from 'pg';
import { config } from './config';
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
  lastSentAt: number; // timestamp ms
  createdAt: number;
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  createdBy: string;
  createdAt: string;
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
  badgeColor: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
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
  createdAt: string;
}

export interface UserSettings {
  bookingLinkActive: boolean;
  allowCustomTimeRequest: boolean;
  allowLunchTimeBooking: boolean;
  dailyReminderActive: boolean;
  dailyReminderTime: string;
  clientSmsReminderActive: boolean;
  theme: 'light' | 'dark' | 'system';
  appLanguage: 'uz' | 'ru';
  securityPin?: string;
  biometricsEnabled: boolean;
}

export interface PushSubscriptionItem {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device?: string;
  createdAt: string;
}

class AppDatabase {
  private pool: Pool | null = null;
  public isPostgresConnected: boolean = false;

  // In-memory data store with mock master and initial data
  public users: User[] = [
    {
      id: 'u-1',
      phone: '+998900335102',
      ism: 'Abubakir',
      familiya: 'Kamalov',
      fullName: 'Abubakir Kamalov',
      role: 'MASTER',
      username: 'abubakir',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      bio: 'Professional Barbero Master & Stylist',
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'u-2',
      phone: '+998901112233',
      ism: 'Bobur',
      familiya: 'Usmonov',
      fullName: 'Bobur Usmonov',
      role: 'MASTER',
      username: 'bobur_u',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      bio: 'Fade Master & Beard Sculptor',
      createdAt: '2026-01-12T10:00:00Z',
    },
    {
      id: 'client-1',
      phone: '+998909998877',
      ism: 'Sardor',
      familiya: 'Rahimov',
      fullName: 'Sardor Rahimov',
      role: 'CLIENT',
      username: 'sardor_r',
      createdAt: '2026-02-01T10:00:00Z',
    },
  ];

  public otpRequests: Map<string, OtpRequest> = new Map();

  public salons: Salon[] = [
    {
      id: 'salon-1',
      name: 'Chorsu Barbershop',
      address: 'Toshkent sh., Navoiy ko‘chasi 14-uy',
      latitude: 41.3275,
      longitude: 69.2401,
      createdBy: 'u-1',
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'salon-2',
      name: 'Yunusobod Top Barber',
      address: 'Toshkent sh., Amir Temur shoh ko‘chasi 107-uy',
      latitude: 41.3655,
      longitude: 69.2891,
      createdBy: 'u-2',
      createdAt: '2026-01-20T10:00:00Z',
    },
  ];

  public salonMembers: SalonMember[] = [
    { id: 'sm-1', salonId: 'salon-1', masterId: 'u-1', role: 'owner', joinedAt: '2026-01-15T10:00:00Z' },
    { id: 'sm-2', salonId: 'salon-2', masterId: 'u-2', role: 'owner', joinedAt: '2026-01-20T10:00:00Z' },
  ];

  public services: Service[] = [
    { id: 'srv-1', userId: 'u-1', name: 'Erkaklar soch turmagi', price: 50000, duration: 30, badgeColor: '#A67C2E', isActive: true },
    { id: 'srv-2', userId: 'u-1', name: 'Soch + soqol tekislash', price: 70000, duration: 45, badgeColor: '#2563EB', isActive: true },
    { id: 'srv-3', userId: 'u-1', name: 'Bolalar soch turmagi', price: 35000, duration: 25, badgeColor: '#059669', isActive: true },
    { id: 'srv-4', userId: 'u-1', name: 'Premium SPA parvarish', price: 120000, duration: 60, badgeColor: '#7C3AED', isActive: true },
    { id: 'srv-5', userId: 'u-2', name: 'Klassik fade', price: 60000, duration: 30, badgeColor: '#A67C2E', isActive: true },
  ];

  public clients: Client[] = [
    { id: 'cl-1', userId: 'u-1', name: 'Azamat Qosimov', phone: '+998901112233', notes: 'Har 2 haftada keladi', totalSpent: 250000, visitsCount: 5 },
    { id: 'cl-2', userId: 'u-1', name: 'Bekzod Aliyev', phone: '+998902223344', notes: 'Soqol tekislash', totalSpent: 140000, visitsCount: 2 },
    { id: 'cl-3', userId: 'u-1', name: 'Jamshid Karimov', phone: '+998903334455', notes: 'Fade yoqadi', totalSpent: 300000, visitsCount: 6 },
    { id: 'cl-4', userId: 'u-1', name: 'Davron Rustamov', phone: '+998904445566', totalSpent: 50000, visitsCount: 1 },
  ];

  public appointments: Appointment[] = [
    {
      id: 'apt-1',
      userId: 'u-1',
      clientId: 'cl-1',
      clientName: 'Azamat Qosimov',
      clientPhone: '+998901112233',
      serviceId: 'srv-1',
      serviceName: 'Erkaklar soch turmagi',
      servicePrice: 50000,
      badgeColor: '#A67C2E',
      date: '2026-10-04',
      startTime: '10:00',
      endTime: '10:30',
      duration: 30,
      status: 'confirmed',
    },
    {
      id: 'apt-2',
      userId: 'u-1',
      clientId: 'cl-2',
      clientName: 'Bekzod Aliyev',
      clientPhone: '+998902223344',
      serviceId: 'srv-2',
      serviceName: 'Soch + soqol tekislash',
      servicePrice: 70000,
      badgeColor: '#2563EB',
      date: '2026-10-04',
      startTime: '11:00',
      endTime: '11:45',
      duration: 45,
      status: 'confirmed',
    },
    {
      id: 'apt-3',
      userId: 'u-1',
      clientId: 'cl-3',
      clientName: 'Jamshid Karimov',
      clientPhone: '+998903334455',
      serviceId: 'srv-4',
      serviceName: 'Premium SPA parvarish',
      servicePrice: 120000,
      badgeColor: '#7C3AED',
      date: '2026-10-04',
      startTime: '14:00',
      endTime: '15:00',
      duration: 60,
      status: 'confirmed',
    },
  ];

  public workingHours: Map<string, WorkingDay[]> = new Map([
    [
      'u-1',
      [
        { dayOfWeek: 'Dushanba', dayIndex: 1, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Seshanba', dayIndex: 2, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Chorshanba', dayIndex: 3, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Payshanba', dayIndex: 4, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Juma', dayIndex: 5, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Shanba', dayIndex: 6, isWorking: true, startTime: '09:00', endTime: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Yakshanba', dayIndex: 0, isWorking: false, startTime: '10:00', endTime: '18:00', lunchStart: '13:00', lunchEnd: '14:00' },
      ],
    ],
  ]);

  public portfolioPhotos: PortfolioPhoto[] = [
    {
      id: 'photo-1',
      userId: 'u-1',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
      caption: 'Klassik erkaklar soch turmagi va soqol parvarishi',
      likesCount: 24,
      isPublic: true,
      createdAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'photo-2',
      userId: 'u-1',
      imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80',
      caption: 'Low fade va chiziqlar',
      likesCount: 42,
      isPublic: true,
      createdAt: '2026-09-05T12:00:00Z',
    },
    {
      id: 'photo-3',
      userId: 'u-1',
      imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80',
      caption: 'Soqol shakllantirish va issiq sochiq muolajasi',
      likesCount: 19,
      isPublic: true,
      createdAt: '2026-09-10T15:00:00Z',
    },
  ];

  public bookingRequests: BookingRequest[] = [
    {
      id: 'req-1',
      masterId: 'u-1',
      clientName: 'Sardor Rahimov',
      clientPhone: '+998909998877',
      serviceId: 'srv-1',
      serviceName: 'Erkaklar soch turmagi',
      servicePrice: 50000,
      badgeColor: '#A67C2E',
      date: '2026-10-04',
      time: '16:00',
      duration: 30,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];

  public pushSubscriptions: PushSubscriptionItem[] = [];

  public userSettings: Map<string, UserSettings> = new Map([
    [
      'u-1',
      {
        bookingLinkActive: true,
        allowCustomTimeRequest: false,
        allowLunchTimeBooking: false,
        dailyReminderActive: true,
        dailyReminderTime: '09:00',
        clientSmsReminderActive: true,
        theme: 'system',
        appLanguage: 'uz',
        securityPin: '1234',
        biometricsEnabled: true,
      },
    ],
  ]);

  constructor() {
    this.initPostgres();
  }

  private async initPostgres() {
    if (!config.databaseUrl) {
      console.log('[Database] Fast local store active (DATABASE_URL not set).');
      return;
    }
    try {
      this.pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.databaseUrl.includes('neon.tech') || config.databaseUrl.includes('supabase')
          ? { rejectUnauthorized: false }
          : undefined,
      });
      await this.pool.query('SELECT 1');
      this.isPostgresConnected = true;
      console.log('[Database] Connected to PostgreSQL successfully.');
      await this.runMigrations();
    } catch (err: any) {
      console.warn('[Database] PostgreSQL connection failed, running in resilient fallback mode:', err?.message);
      this.isPostgresConnected = false;
    }
  }

  private async runMigrations() {
    if (!this.pool) return;
    try {
      const schemaPath = path.resolve(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf-8');
        await this.pool.query(sql);
        console.log('[Database] Schema migrations applied successfully.');
      }
    } catch (e: any) {
      console.warn('[Database] Migration note:', e?.message);
    }
  }

  // --- User methods ---
  public getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getUserByPhone(phone: string): User | undefined {
    return this.users.find((u) => u.phone === phone);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username?.toLowerCase() === username.toLowerCase());
  }

  public createUser(user: User): User {
    this.users.push(user);
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...updates };
    return this.users[idx];
  }

  // --- OTP session methods ---
  public getOtpSession(phone: string): OtpRequest | undefined {
    return this.otpRequests.get(phone);
  }

  public saveOtpSession(phone: string, requestId: string): void {
    const now = Date.now();
    const existing = this.otpRequests.get(phone);
    this.otpRequests.set(phone, {
      phone,
      requestId,
      attempts: 0,
      lastSentAt: now,
      createdAt: existing ? existing.createdAt : now,
    });
  }

  public incrementOtpAttempts(phone: string): number {
    const session = this.otpRequests.get(phone);
    if (!session) return 0;
    session.attempts += 1;
    this.otpRequests.set(phone, session);
    return session.attempts;
  }

  public deleteOtpSession(phone: string): void {
    this.otpRequests.delete(phone);
  }

  // --- Services methods ---
  public getServices(userId: string): Service[] {
    return this.services.filter((s) => s.userId === userId);
  }

  public getServiceById(id: string): Service | undefined {
    return this.services.find((s) => s.id === id);
  }

  // --- Appointments methods ---
  public getAppointments(userId: string, date?: string): Appointment[] {
    return this.appointments.filter((a) => a.userId === userId && (!date || a.date === date));
  }

  public getAppointmentById(id: string): Appointment | undefined {
    return this.appointments.find((a) => a.id === id);
  }

  public hasActiveSlotConflict(userId: string, date: string, startTime: string, excludeId?: string): boolean {
    return this.appointments.some(
      (a) => a.userId === userId && a.date === date && a.startTime === startTime && a.status !== 'cancelled' && a.id !== excludeId
    );
  }

  public createAppointment(apt: Appointment): Appointment {
    if (this.hasActiveSlotConflict(apt.userId, apt.date, apt.startTime)) {
      throw new Error("Ushbu vaqt oralig'i allaqachon band qilingan");
    }
    this.appointments.push(apt);
    return apt;
  }

  public updateAppointment(id: string, updates: Partial<Appointment>): Appointment | undefined {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.appointments[idx] = { ...this.appointments[idx], ...updates };
    return this.appointments[idx];
  }

  // --- Clients methods ---
  public getClients(userId: string): Client[] {
    return this.clients.filter((c) => c.userId === userId);
  }

  public createOrUpdateClient(userId: string, name: string, phone: string, spentDelta = 0): Client {
    let client = this.clients.find((c) => c.userId === userId && c.phone === phone);
    if (client) {
      client.totalSpent += spentDelta;
      if (spentDelta > 0) client.visitsCount += 1;
      client.name = name || client.name;
    } else {
      client = {
        id: `cl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId,
        name,
        phone,
        totalSpent: spentDelta,
        visitsCount: spentDelta > 0 ? 1 : 0,
      };
      this.clients.push(client);
    }
    return client;
  }

  // --- Booking requests ---
  public getBookingRequests(masterId: string): BookingRequest[] {
    return this.bookingRequests.filter((r) => r.masterId === masterId);
  }

  public getBookingRequestById(id: string): BookingRequest | undefined {
    return this.bookingRequests.find((r) => r.id === id);
  }

  // --- Settings ---
  public getUserSettings(userId: string): UserSettings {
    const settings = this.userSettings.get(userId);
    if (!settings) {
      const defaultSettings: UserSettings = {
        bookingLinkActive: true,
        allowCustomTimeRequest: false,
        allowLunchTimeBooking: false,
        dailyReminderActive: true,
        dailyReminderTime: '09:00',
        clientSmsReminderActive: true,
        theme: 'system',
        appLanguage: 'uz',
        securityPin: '1234',
        biometricsEnabled: true,
      };
      this.userSettings.set(userId, defaultSettings);
      return defaultSettings;
    }
    return settings;
  }

  public updateUserSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
    const current = this.getUserSettings(userId);
    const updated = { ...current, ...updates };
    this.userSettings.set(userId, updated);
    return updated;
  }

  // --- Working Hours ---
  public getWorkingHours(userId: string): WorkingDay[] {
    const wh = this.workingHours.get(userId);
    if (!wh) {
      const defaultWh: WorkingDay[] = [
        { dayOfWeek: 'Dushanba', dayIndex: 1, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Seshanba', dayIndex: 2, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Chorshanba', dayIndex: 3, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Payshanba', dayIndex: 4, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Juma', dayIndex: 5, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Shanba', dayIndex: 6, isWorking: true, startTime: '09:00', endTime: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
        { dayOfWeek: 'Yakshanba', dayIndex: 0, isWorking: false, startTime: '10:00', endTime: '18:00', lunchStart: '13:00', lunchEnd: '14:00' },
      ];
      this.workingHours.set(userId, defaultWh);
      return defaultWh;
    }
    return wh;
  }

  public updateWorkingHours(userId: string, hours: WorkingDay[]): WorkingDay[] {
    this.workingHours.set(userId, hours);
    return hours;
  }
}

export const db = new AppDatabase();
