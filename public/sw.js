// 1. Listen for the incoming Push Notification from your backend
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/images/Logo.svg', // Uses your existing KneuraSense logo
      badge: '/images/Logo.svg',
      vibrate: [300, 100, 400, 100, 500], // Aggressive vibration pattern
      requireInteraction: true, // Forces the user to dismiss or click it
      data: {
        // We pass the specific instruction URL hidden inside the notification
        url: data.url, 
      },
    };

    // Wake up the phone and show the banner
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// 2. Listen for when the elderly user taps the notification
self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Close the native OS banner
  
  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the dashboard is already open in the background, bring it to the front
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      // If the browser was completely closed, open a fresh window to the URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});