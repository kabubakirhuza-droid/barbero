import webpush from 'web-push';
import { db, PushSubscriptionItem } from './db';
import { config } from './config';

// Initialize VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BM-8Mn8egdGXkKokUrxWVl5XabsOj-b3ZfHIQ-bb879jaiY6uGatyTcSUV5fu2-vE20kDGywC8ruGWno9kU-M1U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'Aswtv38VelVCli8rN15gu4H2QwFG96KVAjV2wl-WvPw';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@barbero.uz';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[WebPush] VAPID configured successfully.');
} catch (err) {
  console.error('[WebPush] Error setting VAPID details:', err);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    screen?: string;
    [key: string]: any;
  };
}

export class PushService {
  public getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  public saveSubscription(userId: string, subscription: any, device?: string): PushSubscriptionItem {
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      throw new Error('Noto‘g‘ri Push Subscription formati');
    }

    // Remove existing subscription with same endpoint to avoid duplicates
    db.pushSubscriptions = db.pushSubscriptions.filter((s) => s.endpoint !== endpoint);

    const newSub: PushSubscriptionItem = {
      id: `push-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: userId || 'u-1',
      endpoint,
      p256dh,
      auth,
      device: device || 'Web Browser',
      createdAt: new Date().toISOString(),
    };

    db.pushSubscriptions.push(newSub);
    console.log(`[PushService] Subscribed user ${userId} (${db.pushSubscriptions.length} total active subs)`);
    return newSub;
  }

  public removeSubscription(endpoint: string): boolean {
    const before = db.pushSubscriptions.length;
    db.pushSubscriptions = db.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
    return db.pushSubscriptions.length < before;
  }

  public getUserSubscriptions(userId: string): PushSubscriptionItem[] {
    return db.pushSubscriptions.filter((s) => s.userId === userId);
  }

  public async sendNotificationToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
    const subs = this.getUserSubscriptions(userId);
    if (subs.length === 0) {
      console.log(`[PushService] No subscriptions for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/assets/icon.png',
      badge: payload.badge || '/assets/icon.png',
      tag: payload.tag || 'barbero-general',
      data: {
        url: payload.data?.url || '/',
        screen: payload.data?.screen || 'So\'rovlar',
        ...payload.data,
      },
    });

    for (const sub of subs) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, payloadString);
        sent += 1;
        console.log(`[PushService] Push sent to user ${userId} on ${sub.device}`);
      } catch (error: any) {
        failed += 1;
        console.error(`[PushService] Failed to send push:`, error?.statusCode || error?.message);

        // If subscription is 404 or 410 (expired/unregistered), delete it
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          console.log(`[PushService] Removing expired subscription ${sub.endpoint}`);
          this.removeSubscription(sub.endpoint);
        }
      }
    }

    return { sent, failed };
  }

  public async sendTestNotification(userId: string, endpoint?: string): Promise<{ success: boolean; message: string }> {
    let subs = this.getUserSubscriptions(userId);
    if (endpoint) {
      const specific = subs.filter((s) => s.endpoint === endpoint);
      if (specific.length > 0) subs = specific;
    }

    if (subs.length === 0) {
      return {
        success: false,
        message: 'Qurilma push-bildirishnomalarga ulanmagan. Iltimos, oldin ruxsat bering va obuna bo‘ling.',
      };
    }

    const payload: PushPayload = {
      title: 'Barbero: Test bildirishnoma ✂️',
      body: 'Push-bildirishnomalar muvaffaqiyatli ishlayapti! Yangi so‘rovlar va eslatmalar shu tarzda keladi.',
      tag: 'barbero-test',
      data: {
        screen: 'So\'rovlar',
        url: '/',
      },
    };

    const res = await this.sendNotificationToUser(userId, payload);
    if (res.sent > 0) {
      return {
        success: true,
        message: 'Test bildirishnoma qurilmangizga yuborildi!',
      };
    } else {
      return {
        success: false,
        message: 'Bildirishnoma yuborishda xatolik yuz berdi. Iltimos, brauzer ruxsatlarini tekshiring.',
      };
    }
  }
}

export const pushService = new PushService();
