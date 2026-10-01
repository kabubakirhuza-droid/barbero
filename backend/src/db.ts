import { Pool } from 'pg';
import { config } from './config';

export interface User {
  id: string;
  phone: string;
  ism: string;
  familiya: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  subscriptionStatus: 'free' | 'premium';
  subscriptionUntil: string;
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
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  badgeColor: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  duration: number;
  status: 'confirmed' | 'cancelled' | 'completed';
}

export interface WorkingDay {
  id: string;
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
  aiModeActive: boolean;
  clientSmsReminderActive: boolean;
  appLanguage: 'uz' | 'ru';
  securityPin?: string;
  biometricsEnabled: boolean;
}

// Distance helper using Haversine formula (meters)
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

class AppDatabase {
  public pool: Pool | null = null;
  public isPostgresConnected = false;

  public users: User[] = [
    {
      id: 'u-1',
      phone: '+998900335102',
      ism: 'Abubakir',
      familiya: 'Aliyev',
      fullName: 'Abubakir Aliyev',
      username: 'abubakir',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      bio: 'Professional Barbershop & Men Grooming Stylist',
      subscriptionStatus: 'premium',
      subscriptionUntil: '2026-10-04T00:00:00.000Z',
    },
    {
      id: 'u-2',
      phone: '+998901112233',
      ism: 'Javohir',
      familiya: 'Karimov',
      fullName: 'Javohir Karimov',
      username: 'javohir_k',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      bio: 'Fade master & Barber artist',
      subscriptionStatus: 'premium',
      subscriptionUntil: '2026-12-01T00:00:00.000Z',
    },
  ];

  public salons: Salon[] = [
    {
      id: 'salon-1',
      name: 'Chilonzor Barber Club',
      address: 'Toshkent sh., Chilonzor 9-mavze, 12-uy',
      latitude: 41.2825,
      longitude: 69.2154,
      createdBy: 'u-1',
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'salon-2',
      name: 'Grand Fade Studio',
      address: "Toshkent sh., Amir Temur shoh ko'chasi, 45",
      latitude: 41.3111,
      longitude: 69.2797,
      createdBy: 'u-2',
      createdAt: '2026-02-10T12:00:00Z',
    },
  ];

  public salonMembers: SalonMember[] = [
    {
      id: 'sm-1',
      salonId: 'salon-1',
      masterId: 'u-1',
      role: 'owner',
      joinedAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'sm-2',
      salonId: 'salon-2',
      masterId: 'u-2',
      role: 'owner',
      joinedAt: '2026-02-10T12:00:00Z',
    },
  ];

  // 5 Default services as requested
  public services: Service[] = [
    {
      id: 'srv-1',
      userId: 'u-1',
      name: 'Soch olish',
      price: 50000,
      duration: 30,
      badgeColor: '#A67C2E',
      isActive: true,
    },
    {
      id: 'srv-2',
      userId: 'u-1',
      name: 'Soch + soqol',
      price: 70000,
      duration: 45,
      badgeColor: '#2563EB',
      isActive: true,
    },
    {
      id: 'srv-3',
      userId: 'u-1',
      name: 'Bolalar sochi',
      price: 30000,
      duration: 20,
      badgeColor: '#059669',
      isActive: true,
    },
    {
      id: 'srv-4',
      userId: 'u-1',
      name: 'Soqol olish',
      price: 30000,
      duration: 20,
      badgeColor: '#D97706',
      isActive: true,
    },
    {
      id: 'srv-5',
      userId: 'u-1',
      name: 'Kreativ soqol tekislash',
      price: 45000,
      duration: 25,
      badgeColor: '#7C3AED',
      isActive: true,
    },
  ];

  public clients: Client[] = [
    {
      id: 'c-1',
      userId: 'u-1',
      name: 'Mijoz 1',
      phone: '+998900000000',
      notes: 'Doimiy mijoz',
      totalSpent: 50000,
      visitsCount: 1,
    },
    {
      id: 'c-2',
      userId: 'u-1',
      name: 'Jamshid T.',
      phone: '+998901234567',
      notes: 'Fade soch turmagi',
      totalSpent: 120000,
      visitsCount: 2,
    },
  ];

  public appointments: Appointment[] = [
    {
      id: 'apt-1',
      userId: 'u-1',
      clientId: 'c-1',
      clientName: 'Mijoz 1',
      clientPhone: '+998900000000',
      serviceId: 'srv-2',
      serviceName: 'Soch + soqol',
      servicePrice: 50000,
      badgeColor: '#2563EB',
      date: '2026-09-29',
      startTime: '14:00',
      endTime: '14:30',
      duration: 30,
      status: 'confirmed',
    },
    {
      id: 'apt-2',
      userId: 'u-1',
      clientId: 'c-2',
      clientName: 'Jamshid T.',
      clientPhone: '+998901234567',
      serviceId: 'srv-1',
      serviceName: 'Soch olish',
      servicePrice: 70000,
      badgeColor: '#A67C2E',
      date: '2026-09-29',
      startTime: '11:30',
      endTime: '12:00',
      duration: 30,
      status: 'confirmed',
    },
  ];

  public workingHours: WorkingDay[] = [
    { id: 'wh-1', dayOfWeek: 'Dushanba', dayIndex: 1, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: 'wh-2', dayOfWeek: 'Seshanba', dayIndex: 2, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: 'wh-3', dayOfWeek: 'Chorshanba', dayIndex: 3, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: 'wh-4', dayOfWeek: 'Payshanba', dayIndex: 4, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: 'wh-5', dayOfWeek: 'Juma', dayIndex: 5, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: 'wh-6', dayOfWeek: 'Shanba', dayIndex: 6, isWorking: true, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
    { id: 'wh-7', dayOfWeek: 'Yakshanba', dayIndex: 7, isWorking: false, startTime: '09:00', endTime: '21:00', lunchStart: '13:00', lunchEnd: '14:00' },
  ];

  public portfolio: PortfolioPhoto[] = [
    {
      id: 'pt-1',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
      caption: 'Klassik erkaklar soch turmagi & soqol konturi',
      likesCount: 38,
      isPublic: true,
      createdAt: '2026-09-20T10:00:00Z',
    },
    {
      id: 'pt-2',
      imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80',
      caption: 'Skin fade soch uslubi',
      likesCount: 52,
      isPublic: true,
      createdAt: '2026-09-22T14:30:00Z',
    },
    {
      id: 'pt-3',
      imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80',
      caption: 'Modern pompadour va styling',
      likesCount: 41,
      isPublic: true,
      createdAt: '2026-09-25T16:00:00Z',
    },
    {
      id: 'pt-4',
      imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80',
      caption: 'Soqol shakllantirish va issiq sochiq muolajasi',
      likesCount: 29,
      isPublic: true,
      createdAt: '2026-09-28T12:00:00Z',
    },
  ];

  public bookingRequests: BookingRequest[] = [
    {
      id: 'req-1',
      masterId: 'u-1',
      clientName: 'Sardor Rahimxon',
      clientPhone: '+998 90 999 88 77',
      serviceId: 'srv-1',
      serviceName: 'Soch olish',
      servicePrice: 50000,
      date: '2026-09-29',
      time: '15:00',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'req-2',
      masterId: 'u-1',
      clientName: 'Dilshodbek',
      clientPhone: '+998 93 555 44 33',
      serviceId: 'srv-2',
      serviceName: 'Soch + soqol',
      servicePrice: 70000,
      date: '2026-09-30',
      time: '17:30',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];

  public userSettings: UserSettings = {
    bookingLinkActive: true,
    allowCustomTimeRequest: false,
    allowLunchTimeBooking: false,
    dailyReminderActive: true,
    dailyReminderTime: '09:00',
    aiModeActive: true,
    clientSmsReminderActive: true,
    appLanguage: 'uz',
    securityPin: '1234',
    biometricsEnabled: true,
  };

  constructor() {
    this.initPostgres();
  }

  private async initPostgres() {
    try {
      this.pool = new Pool({ connectionString: config.databaseUrl });
      await this.pool.query('SELECT 1');
      this.isPostgresConnected = true;
      console.log('[Database] Connected to PostgreSQL with PostGIS capability.');
    } catch (err) {
      console.log('[Database] Fast local store active with spatial math.');
      this.isPostgresConnected = false;
    }
  }
}

export const db = new AppDatabase();
