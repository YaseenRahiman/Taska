// Taska Service Worker for Progressive Web App functionality
// Version 1.0.0

const CACHE_NAME = 'taska-v1';
const STATIC_CACHE = 'taska-static-v1';
const DYNAMIC_CACHE = 'taska-dynamic-v1';
const API_CACHE = 'taska-api-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/globals.css',
  // Core pages for offline access
  '/client/dashboard',
  '/artisan/dashboard', 
  '/admin/dashboard',
  // Essential API endpoints for offline
  '/api/auth/profile',
  '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/profile',
  '/api/jobs',
  '/api/bids',
  '/api/messages/conversations',
  '/api/notifications'
];

// Network timeout for falling back to cache
const NETWORK_TIMEOUT = 3000;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with Cache Fallback
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    // Static assets - Cache First
    event.respondWith(handleStaticAsset(request));
  } else {
    // Pages - Network First with Cache Fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first with timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
      )
    ]);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed for API, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for failed API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Ignore network errors for background updates
    });
    
    return cachedResponse;
  }
  
  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed for page, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await cache.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Final fallback
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Taska - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: #FDF5E6;
              color: #333;
            }
            .container { 
              text-align: center; 
              max-width: 400px; 
              padding: 2rem;
            }
            .logo { 
              color: #16A085; 
              font-size: 2rem; 
              font-weight: bold; 
              margin-bottom: 1rem; 
            }
            .message { 
              margin-bottom: 1.5rem; 
              line-height: 1.6;
            }
            .retry-btn { 
              background: #16A085; 
              color: white; 
              border: none; 
              padding: 0.75rem 1.5rem; 
              border-radius: 0.5rem; 
              cursor: pointer;
              font-size: 1rem;
            }
            .retry-btn:hover { 
              background: #138D75; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Taska</div>
            <div class="message">
              <h2>You're offline</h2>
              <p>Please check your internet connection and try again.</p>
            </div>
            <button class="retry-btn" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        </body>
      </html>`,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext)) || pathname.startsWith('/_next/static/');
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncOfflineMessages());
  } else if (event.tag === 'background-sync-bids') {
    event.waitUntil(syncOfflineBids());
  }
});

// Sync offline messages when connection is restored
async function syncOfflineMessages() {
  try {
    // Get offline messages from IndexedDB (placeholder)
    console.log('[Service Worker] Syncing offline messages');
    // Implementation would sync pending messages with server
  } catch (error) {
    console.error('[Service Worker] Failed to sync messages:', error);
  }
}

// Sync offline bids when connection is restored
async function syncOfflineBids() {
  try {
    // Get offline bids from IndexedDB (placeholder)
    console.log('[Service Worker] Syncing offline bids');
    // Implementation would sync pending bids with server
  } catch (error) {
    console.error('[Service Worker] Failed to sync bids:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  const options = {
    body: 'You have a new notification from Taska',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'Taska';
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('Taska', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  }
});

// Handle periodic background sync (for future implementation)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-dashboard') {
    event.waitUntil(updateDashboardCache());
  }
});

// Update dashboard cache periodically
async function updateDashboardCache() {
  try {
    console.log('[Service Worker] Updating dashboard cache');
    const cache = await caches.open(API_CACHE);
    
    // Refresh critical dashboard data
    const dashboardEndpoints = [
      '/api/auth/profile',
      '/api/jobs?limit=10',
      '/api/notifications?unread=true'
    ];
    
    await Promise.all(
      dashboardEndpoints.map(async (endpoint) => {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            await cache.put(endpoint, response);
          }
        } catch (error) {
          console.log('[Service Worker] Failed to update cache for:', endpoint);
        }
      })
    );
  } catch (error) {
    console.error('[Service Worker] Failed to update dashboard cache:', error);
  }
}

// Listen for cache update messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'UPDATE_CACHE') {
    event.waitUntil(updateSpecificCache(event.data.url));
  }
});

// Update specific cache entry
async function updateSpecificCache(url) {
  try {
    const cache = await caches.open(API_CACHE);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response);
    }
  } catch (error) {
    console.log('[Service Worker] Failed to update cache for:', url);
  }
}
