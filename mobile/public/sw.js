/* Barbero Service Worker for Web Push and Offline Reliability */

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activated');
  event.waitUntil(self.clients.claim());
});

// Listen for Push Notifications from backend web-push
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push event received:', event);

  let data = {
    title: 'Barbero',
    body: 'Yangi bildirishnoma mavjud',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'barbero-notification',
    data: { url: '/', screen: 'bookingRequests' },
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'barbero-notification',
    data: data.data || { url: '/' },
    vibrate: [200, 100, 200],
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Barbero', notificationOptions)
  );
});

// Handle clicking on a notification
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.notification.tag);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.postMessage({
              type: 'NAVIGATE',
              screen: event.notification.data?.screen || 'bookingRequests',
            });
            return client.focus();
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
