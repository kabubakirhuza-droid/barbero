import { Platform } from 'react-native';
import { api } from '../api/apiClient';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushStatusInfo {
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'default' | 'unsupported';
  isSubscribed: boolean;
  isIos: boolean;
  isStandalone: boolean;
  isTelegramOrInstagram: boolean;
  deviceInfo: string;
}

export class WebPushManager {
  private swRegistration: ServiceWorkerRegistration | null = null;

  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      console.log('[WebPush] Service Worker registered with scope:', reg.scope);
      return reg;
    } catch (error) {
      console.error('[WebPush] Service Worker registration failed:', error);
      return null;
    }
  }

  public async getStatus(): Promise<PushStatusInfo> {
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
    if (!isWeb) {
      return {
        isSupported: false,
        permission: 'unsupported',
        isSubscribed: false,
        isIos: false,
        isStandalone: false,
        isTelegramOrInstagram: false,
        deviceInfo: Platform.OS,
      };
    }

    const ua = navigator.userAgent || '';
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    const isTelegramOrInstagram = /Telegram|Instagram/i.test(ua);

    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    const permission = 'Notification' in window ? (Notification.permission as any) : 'unsupported';

    let isSubscribed = false;
    try {
      if (isSupported) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        isSubscribed = !!sub;
      }
    } catch (e) {
      isSubscribed = false;
    }

    const deviceInfo = isIos
      ? `iPhone (iOS${isStandalone ? ' • PWA' : ''})`
      : /Android/i.test(ua)
      ? 'Android (Chrome)'
      : 'Web Browser';

    return {
      isSupported,
      permission,
      isSubscribed,
      isIos,
      isStandalone,
      isTelegramOrInstagram,
      deviceInfo,
    };
  }

  public async subscribe(): Promise<{ success: boolean; message: string }> {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return { success: false, message: 'Push-bildirishnomalar faqat veb/mobil brauzerda ishlaydi' };
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return { success: false, message: 'Bu brauzerda Web Push qo‘llab-quvvatlanmaydi' };
    }

    try {
      // 1. Request notification permission on user action
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        return {
          success: false,
          message:
            perm === 'denied'
              ? 'Bildirishnomalarga ruxsat berilmadi. Iltimos, brauzer sozlamalaridan ruxsat bering.'
              : 'Ruxsat so‘rovi bekor qilindi.',
        };
      }

      // 2. Ensure SW ready
      const reg = await navigator.serviceWorker.ready;

      // 3. Get VAPID public key from backend
      const { publicKey } = await api.getVapidPublicKey();
      if (!publicKey) {
        throw new Error('VAPID public key topilmadi');
      }

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      // 4. Subscribe via PushManager
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as any,
      });

      // 5. Send subscription to server
      const status = await this.getStatus();
      await api.subscribePush(subscription.toJSON(), status.deviceInfo);

      return {
        success: true,
        message: 'Push-bildirishnomalar muvaffaqiyatli yoqildi!',
      };
    } catch (err: any) {
      console.error('[WebPush] Subscribe error:', err);
      return {
        success: false,
        message: err.message || 'Push-bildirishnomaga obuna bo‘lishda xatolik yuz berdi',
      };
    }
  }

  public async unsubscribe(): Promise<{ success: boolean; message: string }> {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return { success: false, message: 'Amal bajarib bo‘lmadi' };
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await api.unsubscribePush(endpoint);
      }
      return { success: true, message: 'Bildirishnomalar o‘chirildi' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Xatolik' };
    }
  }

  public async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        const endpoint = sub ? sub.endpoint : undefined;
        return await api.sendTestPush(endpoint);
      }
      return await api.sendTestPush();
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Test bildirishnoma yuborishda xatolik yuz berdi',
      };
    }
  }
}

export const webPushManager = new WebPushManager();
