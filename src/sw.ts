/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>;
};

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, action_url, ...rest } = data;

    event.waitUntil(
      self.registration.showNotification(title || 'Task Buddy', {
        body: body || '',
        icon: icon || '/task-buddy-icon.svg',
        data: { action_url },
        ...rest,
      })
    );
  } catch (err) {
    console.error('Push event error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action_url = event.notification.data?.action_url;

  if (action_url) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Try to find an existing window and navigate it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then((c) => c.navigate(action_url));
          }
        }
        // If no window is found, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(action_url);
        }
      })
    );
  }
});
