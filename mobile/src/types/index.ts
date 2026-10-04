export type Language = 'uz' | 'ru';

export type UserRole = 'CLIENT' | 'MASTER';

export interface User {
  id: string;
  phone: string;
  role?: UserRole;
  ism?: string;
  familiya?: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  createdBy?: string;
  distanceMeters?: number;
  mastersCount?: number;
  memberCount?: number;
  masters?: Array<{
    masterId: string;
    role: string;
    fullName: string;
    username: string;
  }>;
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
  userId?: string;
  name: string;
  price: number;
  duration: number; // minutes
  badgeColor: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  totalSpent: number;
  visitsCount: number;
}

export interface Appointment {
  id: string;
  userId?: string;
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

export interface AnalyticsData {
  period: string;
  from?: string;
  to?: string;
  revenue: {
    total: number;
    formatted: string;
    totalBookings: number;
    avgPayment: number;
    growthRate: string;
    title: string;
    subtitle: string;
  };
  metrics: {
    clients: {
      total: number;
      growth: string;
      newClients?: number;
    };
    occupancy: {
      percent: string;
      ratio: string;
      bookedDays?: number;
      workingDays?: number;
    };
  };
  dynamics: {
    title: string;
    subtitle: string;
    badge: string;
    chart: Array<{
      label?: string;
      month?: string;
      amount: number;
      heightPercent: number;
      isCurrent?: boolean;
    }>;
  };
}

export interface UserSettings {
  bookingLinkActive: boolean;
  allowCustomTimeRequest: boolean;
  allowLunchTimeBooking: boolean;
  dailyReminderActive: boolean;
  dailyReminderTime: string;
  aiModeActive: boolean;
  clientSmsReminderActive: boolean;
  appLanguage: Language;
  securityPin?: string;
  biometricsEnabled: boolean;
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
