const CACHE_NAME = 'boingbox-v1.0.0';
const STATIC_CACHE = 'boingbox-static-v1.0.0';
const DYNAMIC_CACHE = 'boingbox-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// API routes to cache
const API_ROUTES = [
  '/api/auth/',
  '/api/messages/',
  '/api/groups/',
  '/api/stories/',
  '/api/calls/'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static files
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for API requests
    return new Response(
      JSON.stringify({ 
        error: 'No internet connection',
        message: 'Please check your connection and try again'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static files with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Static file not found in cache and network failed', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Not found', { status: 404 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncOfflineMessages());
  } else if (event.tag === 'background-sync-stories') {
    event.waitUntil(syncOfflineStories());
  }
});

// Sync offline messages
async function syncOfflineMessages() {
  try {
    const db = await openDB();
    const offlineMessages = await db.getAll('offlineMessages');
    
    for (const message of offlineMessages) {
      try {
        const response = await fetch('/api/messages/addmsg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data)
        });
        
        if (response.ok) {
          await db.delete('offlineMessages', message.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync message', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error syncing offline messages', error);
  }
}

// Sync offline stories
async function syncOfflineStories() {
  try {
    const db = await openDB();
    const offlineStories = await db.getAll('offlineStories');
    
    for (const story of offlineStories) {
      try {
        const response = await fetch('/api/stories/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(story.data)
        });
        
        if (response.ok) {
          await db.delete('offlineStories', story.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync story', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Error syncing offline stories', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New message received',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('BoingBox', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// IndexedDB helper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BoingBoxDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('offlineMessages')) {
        db.createObjectStore('offlineMessages', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('offlineStories')) {
        db.createObjectStore('offlineStories', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('userData')) {
        db.createObjectStore('userData', { keyPath: 'key' });
      }
    };
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_API_ROUTE') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.add(event.data.url))
    );
  }
});
