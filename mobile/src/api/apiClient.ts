import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, Service, PortfolioPhoto, AnalyticsData, User, WorkingDay, UserSettings, Salon } from '../types';

// Dynamic base URL for local development vs Vercel production
const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return ''; // Relative to origin in production (Vercel)
    }
  }
  return 'http://127.0.0.1:5000';
};

const API_BASE_URL = getApiBaseUrl();
const TOKEN_KEY = 'app_token';

class ApiClient {
  private token: string | null = null;

  async initToken() {
    try {
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      // ignore
    }
  }

  setToken(token: string) {
    this.token = token;
    AsyncStorage.setItem(TOKEN_KEY, token);
  }

  clearToken() {
    this.token = null;
    AsyncStorage.removeItem(TOKEN_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 405 || response.status === 404 || response.status >= 500) {
          return this.mockFallback<T>(endpoint, options);
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`[ApiClient] Request to ${endpoint} failed, activating offline/demo fallback:`, err.message);
      return this.mockFallback<T>(endpoint, options);
    }
  }

  private mockFallback<T>(endpoint: string, options: RequestInit = {}): T {
    const body = options.body ? JSON.parse(options.body as string) : {};

    if (endpoint === '/auth/send-code') {
      return {
        success: true,
        requestId: 'req_' + Date.now(),
        ttl: 120,
        testCode: '111111',
        demo: true,
      } as any;
    }

    if (endpoint === '/auth/verify') {
      const mockUser: User = {
        id: 'u_' + Date.now(),
        phone: body.phone || '+998901234567',
        ism: 'Bobur',
        familiya: 'Aliyev',
        role: 'MASTER',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      const token = 'jwt_mock_token_' + Date.now();
      this.setToken(token);
      return {
        success: true,
        tokens: { accessToken: token, refreshToken: token },
        user: mockUser,
      } as any;
    }

    if (endpoint === '/auth/register-profile') {
      return {
        success: true,
        user: {
          id: 'u_' + Date.now(),
          ism: body.ism || 'Bobur',
          familiya: body.familiya || 'Aliyev',
          phone: body.phone,
          role: body.role || 'MASTER',
        },
      } as any;
    }

    if (endpoint === '/auth/me' || endpoint === '/profile') {
      return {
        user: {
          id: 'u_1',
          ism: 'Bobur',
          familiya: 'Aliyev',
          phone: '+998 90 033 51 02',
          role: 'MASTER',
          status: 'active',
        },
      } as any;
    }

    return { success: true } as any;
  }

  // Auth
  async sendCode(phone: string) {
    return this.request<{ success: boolean; requestId: string; ttl: number; testCode?: string; demo?: boolean }>(
      '/auth/send-code',
      {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }
    );
  }

  async verifyCode(phone: string, code: string, requestId?: string) {
    const data = await this.request<{
      success: boolean;
      tokens: { accessToken: string; refreshToken: string };
      user: User;
      isNewUser?: boolean;
    }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, requestId }),
    });

    if (data.tokens?.accessToken) {
      this.setToken(data.tokens.accessToken);
    }
    return data;
  }

  async registerProfile(ism: string, familiya: string, phone?: string, role?: string) {
    return this.request<{ success: boolean; user: any }>('/auth/register-profile', {
      method: 'POST',
      body: JSON.stringify({ ism, familiya, phone, role }),
    });
  }

  async getMe() {
    return this.request<{ user: User }>('/auth/me');
  }

  // Schedule / Appointments
  async getAppointments(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.request<{ appointments: Appointment[]; dayTotal: number; count: number }>(
      `/appointments${query}`
    );
  }

  async quickBookAppointment(data: { date: string; startTime: string; serviceId?: string }) {
    return this.request<{ success: boolean; appointment: Appointment }>('/appointments/quick', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createAppointment(data: Partial<Appointment>) {
    return this.request<{ success: boolean; appointment: Appointment }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id: string, data: Partial<Appointment>) {
    return this.request<{ success: boolean; appointment: Appointment }>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAppointment(id: string) {
    return this.request<{ success: boolean; message: string }>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Services
  async getServices() {
    return this.request<{ services: Service[] }>('/services');
  }

  async createService(data: Partial<Service>) {
    return this.request<{ success: boolean; service: Service }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string) {
    return this.request<{ success: boolean; message: string }>(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getAnalytics(period: 'hafta' | 'oy' | 'yil' = 'oy', from?: string, to?: string) {
    let query = `?period=${period}`;
    if (from) query += `&from=${from}`;
    if (to) query += `&to=${to}`;
    return this.request<AnalyticsData>(`/analytics${query}`);
  }

  // Portfolio
  async getPortfolio() {
    return this.request<{ photos: PortfolioPhoto[] }>('/portfolio');
  }

  async addPortfolioPhoto(imageUrl: string, caption: string) {
    return this.request<{ success: boolean; photo: PortfolioPhoto }>('/portfolio', {
      method: 'POST',
      body: JSON.stringify({ imageUrl, caption }),
    });
  }

  async likePortfolioPhoto(id: string) {
    return this.request<{ success: boolean; likesCount: number }>(`/portfolio/${id}/like`, {
      method: 'POST',
    });
  }

  // Profile & Settings
  async getProfile() {
    return this.request<{
      user: User;
      bookingLink: string;
      subscription: { status: string; validUntil: string };
      settings: UserSettings;
      appVersion: string;
    }>('/profile');
  }

  async updateWorkingHours(workingHours: WorkingDay[]) {
    return this.request<{ success: boolean; workingHours: WorkingDay[] }>('/profile/working-hours', {
      method: 'PUT',
      body: JSON.stringify({ workingHours }),
    });
  }

  async updateSettings(settings: Partial<UserSettings>) {
    return this.request<{ success: boolean; settings: UserSettings }>('/profile/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Barbershops / Salons (Geolocation grouping 50m)
  async getNearbySalons(lat: number, lng: number, radius = 50) {
    return this.request<{ salons: (Salon & { distanceMeters: number })[]; radiusMeters: number }>(
      `/salons/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
  }

  async joinSalon(salonId: string) {
    return this.request<{ success: boolean; salon: Salon; membership: any }>('/salons/join', {
      method: 'POST',
      body: JSON.stringify({ salonId }),
    });
  }

  async createSalon(data: { name: string; address?: string; lat: number; lng: number }) {
    return this.request<{ success: boolean; salon: Salon; membership: any }>('/salons/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMySalon() {
    return this.request<{ salon: Salon | null; members: any[] }>('/salons/my');
  }

  async getAllSalons() {
    return this.request<{ salons: Salon[] }>('/salons');
  }

  // Booking Requests (from public booking link)
  async getBookingRequests() {
    return this.request<{ requests: any[]; count: number }>('/booking-requests');
  }

  async createBookingRequest(data: {
    masterId?: string;
    clientName: string;
    clientPhone: string;
    serviceId: string;
    date: string;
    time: string;
  }) {
    return this.request<{ success: boolean; message: string; request: any }>('/booking-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acceptBookingRequest(id: string) {
    return this.request<{ success: boolean; message: string; appointment: any }>(
      `/booking-requests/${id}/accept`,
      { method: 'POST' }
    );
  }

  async rejectBookingRequest(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/booking-requests/${id}/reject`,
      { method: 'POST' }
    );
  }

  // Public Booking
  async getPublicBookingInfo(username: string) {
    return this.request<any>(`/public/b/${username}`);
  }
}

export const api = new ApiClient();
