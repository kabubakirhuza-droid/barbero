import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, Service, PortfolioPhoto, AnalyticsData, User, WorkingDay, UserSettings, Salon, BookingRequest } from '../types';

// Dynamic base URL for local development vs Vercel production
const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const port = window.location.port;
    // When served via Vercel dev (3000/3001), Express backend (5000), or production domain:
    if (port !== '8081') {
      return ''; // Relative same-origin URL
    }
  }
  return 'http://127.0.0.1:5000';
};

const API_BASE_URL = getApiBaseUrl();
const TOKEN_KEY = 'barbero_token';

class ApiClient {
  private token: string | null = null;

  async initToken(): Promise<string | null> {
    try {
      this.token =
        (await AsyncStorage.getItem(TOKEN_KEY)) ||
        (await AsyncStorage.getItem('app_token')) ||
        (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(TOKEN_KEY) : null);
      return this.token;
    } catch (e) {
      return null;
    }
  }

  setToken(token: string) {
    this.token = token;
    AsyncStorage.setItem(TOKEN_KEY, token);
    AsyncStorage.setItem('app_token', token);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(TOKEN_KEY, token);
        window.localStorage.setItem('app_token', token);
      } catch (e) {}
    }
  }

  clearToken() {
    this.token = null;
    AsyncStorage.removeItem(TOKEN_KEY);
    AsyncStorage.removeItem('app_token');
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem('app_token');
      } catch (e) {}
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response;
    } catch (error: any) {
      clearTimeout(timer);
      if (error.name === 'AbortError') {
        throw new Error("Internet tezligi past yoki server javob bermayapti (15s timeout)");
      }
      throw error;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
    if (!this.token) {
      await this.initToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const isGet = !options.method || options.method === 'GET';
    let lastError: any = null;
    const maxAttempts = isGet ? retries + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          `${API_BASE_URL}${endpoint}`,
          {
            ...options,
            headers,
          },
          15000
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.error || errorData.message || `Server xatosi: ${response.status}`;
          const err: any = new Error(errMsg);
          err.status = response.status;
          err.code = errorData.code;
          throw err;
        }

        return await response.json();
      } catch (err: any) {
        lastError = err;
        // Don't retry 4xx errors (client / auth errors)
        if (err.status && err.status >= 400 && err.status < 500) {
          throw err;
        }
        if (attempt < maxAttempts - 1) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error("Server bilan bog'lanishda xatolik yuz berdi");
  }

  // --- Auth ---
  async sendCode(phone: string): Promise<{ success: boolean; requestId?: string; ttl?: number; message?: string }> {
    return this.request('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyCode(
    phone: string,
    code: string,
    requestId?: string
  ): Promise<{ success: boolean; isNewUser?: boolean; tokens?: { accessToken: string; refreshToken: string }; user?: User }> {
    const res = await this.request<any>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, requestId }),
    });
    if (res.tokens?.accessToken) {
      this.setToken(res.tokens.accessToken);
    }
    return res;
  }

  async registerProfile(
    ism: string,
    familiya: string,
    role?: 'MASTER' | 'CLIENT'
  ): Promise<{ success: boolean; user: User }> {
    return this.request('/auth/register-profile', {
      method: 'POST',
      body: JSON.stringify({ ism, familiya, role }),
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/auth/me');
  }

  // --- Services ---
  async getServices(): Promise<{ services: Service[] }> {
    return this.request('/services');
  }

  async createService(service: Partial<Service>): Promise<{ success: boolean; service: Service }> {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
  }

  async updateService(id: string, service: Partial<Service>): Promise<{ success: boolean; service: Service }> {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    });
  }

  async deleteService(id: string): Promise<{ success: boolean }> {
    return this.request(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Appointments ---
  async getAppointments(date?: string): Promise<{ appointments: Appointment[]; dayTotal: number; count: number }> {
    const query = date ? `?date=${date}` : '';
    return this.request(`/appointments${query}`);
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<{ success: boolean; appointment: Appointment }> {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
  }

  async quickBook(date: string, startTime: string): Promise<{ success: boolean; appointment: Appointment }> {
    return this.request('/appointments/quick', {
      method: 'POST',
      body: JSON.stringify({ date, startTime }),
    });
  }

  async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<{ success: boolean; appointment: Appointment }> {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    });
  }

  async deleteAppointment(id: string): Promise<{ success: boolean }> {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Clients ---
  async getClients(): Promise<{ clients: any[] }> {
    return this.request('/clients');
  }

  async getInactiveClients(): Promise<{ inactiveClients: any[]; count: number }> {
    return this.request('/clients/inactive');
  }

  async getClient(id: string): Promise<{ client: any; appointments: Appointment[] }> {
    return this.request(`/clients/${id}`);
  }

  async updateClient(id: string, client: any): Promise<{ success: boolean; client: any }> {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  async deleteClient(id: string): Promise<{ success: boolean }> {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Reviews (Ratings & Feedback) ---
  async getReviews(masterId: string): Promise<{ reviews: any[]; avgRating: number; count: number }> {
    return this.request(`/reviews/${masterId}`);
  }

  async submitReview(
    masterId: string,
    clientName: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean; review: any }> {
    return this.request(`/reviews/${masterId}`, {
      method: 'POST',
      body: JSON.stringify({ clientName, rating, comment }),
    });
  }

  // --- Analytics ---
  async getAnalytics(period: 'hafta' | 'oy' | 'yil' | 'custom' = 'oy', from?: string, to?: string): Promise<AnalyticsData> {
    const params = new URLSearchParams({ period });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.request(`/analytics?${params.toString()}`);
  }

  // --- Portfolio ---
  async getPortfolio(userId?: string): Promise<{ photos: PortfolioPhoto[] }> {
    const query = userId ? `?userId=${userId}` : '';
    return this.request(`/portfolio${query}`);
  }

  async addPortfolioPhoto(photoOrUrl: Partial<PortfolioPhoto> | string, caption?: string): Promise<{ success: boolean; photo: PortfolioPhoto }> {
    const body = typeof photoOrUrl === 'string'
      ? { imageUrl: photoOrUrl, caption: caption || '' }
      : photoOrUrl;
    return this.request('/portfolio', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async quickBookAppointment(
    aptOrDate: Partial<Appointment> | string,
    startTime?: string,
    clientName?: string,
    clientPhone?: string,
    serviceId?: string
  ): Promise<{ success: boolean; appointment: Appointment }> {
    if (typeof aptOrDate === 'object') {
      return this.createAppointment(aptOrDate);
    }
    return this.createAppointment({
      date: aptOrDate,
      startTime: startTime || '09:00',
      clientName: clientName || 'Mijoz',
      clientPhone: clientPhone || '',
      serviceId: serviceId || 'srv-1',
    });
  }

  async getAllSalons(): Promise<{ salons: Salon[] }> {
    return this.getSalons();
  }

  async sendTestPush(endpoint?: string): Promise<{ success: boolean; message: string }> {
    const res = await this.testPush(endpoint);
    return {
      success: res.success,
      message: res.message || 'Test bildirishnoma yuborildi',
    };
  }

  async likePortfolioPhoto(id: string): Promise<{ success: boolean; likesCount: number }> {
    return this.request(`/portfolio/${id}/like`, {
      method: 'POST',
    });
  }

  async deletePortfolioPhoto(id: string): Promise<{ success: boolean }> {
    return this.request(`/portfolio/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Profile & Working Hours ---
  async getProfile(): Promise<{ user: User; bookingLink: string; settings: UserSettings; appVersion: string }> {
    return this.request('/profile');
  }

  async updateProfile(profile: Partial<User>): Promise<{ success: boolean; user: User }> {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async getWorkingHours(): Promise<{ workingHours: WorkingDay[] }> {
    return this.request('/profile/working-hours');
  }

  async updateWorkingHours(workingHours: WorkingDay[]): Promise<{ success: boolean; workingHours: WorkingDay[] }> {
    return this.request('/profile/working-hours', {
      method: 'PUT',
      body: JSON.stringify({ workingHours }),
    });
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<{ success: boolean; settings: UserSettings }> {
    return this.request('/profile/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // --- Salons ---
  async getSalons(): Promise<{ salons: Salon[] }> {
    return this.request('/salons');
  }

  async getNearbySalons(lat: number, lng: number, radius?: number): Promise<{ radiusMeters: number; foundCount: number; salons: Salon[] }> {
    const r = radius || 50;
    return this.request(`/salons/nearby?lat=${lat}&lng=${lng}&radius=${r}`);
  }

  async joinSalon(salonId: string): Promise<{ success: boolean; salon: Salon }> {
    return this.request('/salons/join', {
      method: 'POST',
      body: JSON.stringify({ salonId }),
    });
  }

  async createSalon(salon: Partial<Salon>): Promise<{ success: boolean; salon: Salon }> {
    return this.request('/salons/create', {
      method: 'POST',
      body: JSON.stringify(salon),
    });
  }

  async getMySalon(): Promise<{ salon: Salon | null; members: any[] }> {
    return this.request('/salons/my');
  }

  // --- Booking Requests ---
  async getBookingRequests(): Promise<{ requests: BookingRequest[]; count: number }> {
    return this.request('/booking-requests');
  }

  async createBookingRequest(req: Partial<BookingRequest>): Promise<{ success: boolean; request: BookingRequest }> {
    return this.request('/booking-requests', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async acceptBookingRequest(id: string): Promise<{ success: boolean; appointment: Appointment }> {
    return this.request(`/booking-requests/${id}/accept`, {
      method: 'POST',
    });
  }

  async rejectBookingRequest(id: string): Promise<{ success: boolean }> {
    return this.request(`/booking-requests/${id}/reject`, {
      method: 'POST',
    });
  }

  // --- Public Booking ---
  async getPublicMasterInfo(username: string): Promise<any> {
    return this.request(`/public/b/${username}`);
  }

  async getPublicAvailableSlots(username: string, date: string): Promise<{ date: string; slots: { time: string; isAvailable: boolean }[] }> {
    return this.request(`/public/b/${username}/available-slots?date=${date}`);
  }

  async bookPublicSlot(username: string, booking: any): Promise<{ success: boolean; appointment: Appointment }> {
    return this.request(`/public/b/${username}/book`, {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  // --- Web Push ---
  async getVapidPublicKey(): Promise<{ publicKey: string }> {
    return this.request('/push/vapid-public-key');
  }

  async subscribePush(subscription: any, device?: string): Promise<{ success: boolean }> {
    return this.request('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription, device }),
    });
  }

  async unsubscribePush(endpoint: string): Promise<{ success: boolean }> {
    return this.request('/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }

  async testPush(endpoint?: string): Promise<{ success: boolean; message?: string }> {
    return this.request('/push/test', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }

  async getPushStatus(): Promise<{ active: boolean; isSubscribed: boolean; count: number; subscriptionsCount: number; subscriptions: any[] }> {
    return this.request('/push/status');
  }
}

export const api = new ApiClient();
