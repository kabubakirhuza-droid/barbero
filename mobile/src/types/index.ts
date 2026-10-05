export type Language = 'uz' | 'ru';

export type UserRole = 'CLIENT' | 'MASTER';

export interface User {
  id: string;
  phone: string;
  role?: UserRole;
  ism?: string;
  familiya?: string;
  fullName: string;
  name?: string;
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
  clientId?: string;
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
  status: 'confirmed' | 'arrived' | 'done' | 'completed' | 'no_show' | 'cancelled';
  note?: string;
}

export interface BlockedSlot {
  id: string;
  userId?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt?: string;
}

export interface CallLogItem {
  id: string;
  userId: string;
  clientId?: string;
  phone: string;
  name: string;
  direction: 'outgoing_call' | 'incoming_manual' | 'booking_request' | 'appointment';
  type?: 'UNKNOWN' | 'CLIENT' | 'BOOKING' | 'FOLLOW_UP';
  isClient?: boolean;
  visitsCount?: number;
  totalSpent?: number;
  notes?: string;
  lastVisitDate?: string;
  lastServiceName?: string;
  lastServicePrice?: number;
  createdAt: string;
}

export interface ClientSearchResult {
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
}

export interface TodaySlotItem {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  status: 'FREE' | 'OCCUPIED' | 'BLOCKED' | 'CURRENT' | 'PAST';
  appointment?: Appointment;
}

export interface TodayScheduleData {
  date: string;
  dayOfWeek: string;
  appointments: Appointment[];
  currentAppointment: Appointment | null;
  upcomingAppointments: Appointment[];
  freeSlots: TodaySlotItem[];
  stats: {
    totalClients: number;
    completedCount: number;
    totalRevenue: number;
    remainingCount: number;
  };
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

export interface WorkingDay {
  id?: string;
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
  createdAt?: string;
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
  badgeColor?: string;
  date: string;
  time: string;
  duration?: number;
  status: 'new' | 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt?: string;
  createdAt?: string;
}
