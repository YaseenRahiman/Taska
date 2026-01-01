import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { WebSocketProvider } from '@/components/providers/websocket-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import Footer from '@/components/layout/footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'arial', 'sans-serif']
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#16A085' },
    { media: '(prefers-color-scheme: dark)', color: '#16A085' }
  ],
  colorScheme: 'light dark'
};

export const metadata: Metadata = {
  title: {
    default: 'Taska - Connect with Skilled Artisans in South Africa',
    template: '%s | Taska'
  },
  description: 'Find trusted artisans for your home improvement projects. Connect with skilled professionals across South Africa for plumbing, electrical, carpentry, and more.',
  keywords: [
    'artisan',
    'handyman',
    'plumber',
    'electrician',
    'carpenter',
    'home improvement',
    'South Africa',
    'marketplace',
    'services',
    'mobile app',
    'PWA'
  ],
  authors: [{ name: 'Taska Platform Team' }],
  creator: 'Taska Platform',
  publisher: 'Taska Platform',
  metadataBase: new URL('https://taska.co.za'),
  category: 'Business',
  classification: 'Service Platform',
  referrer: 'origin-when-cross-origin',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://taska.co.za',
    title: 'Taska - Connect with Skilled Artisans in South Africa',
    description: 'Find trusted artisans for your home improvement projects. Connect with skilled professionals across South Africa.',
    siteName: 'Taska',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Taska - Connect with Skilled Artisans'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taska - Connect with Skilled Artisans in South Africa',
    description: 'Find trusted artisans for your home improvement projects.',
    images: ['/og-image.jpg'],
    creator: '@TaskaPlatform'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: 'your-google-verification-code'
  },
  appleWebApp: {
    capable: true,
    title: 'Taska',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: true,
    date: false,
    address: true,
    email: true,
    url: true,
  },
  applicationName: 'Taska',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Taska',
    'application-name': 'Taska',
    'msapplication-TileColor': '#16A085',
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'theme-color': '#16A085',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <head>
        {/* PWA and Mobile Optimization */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Favicons and Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        
        {/* Apple and Mobile Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Taska" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Taska" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#16A085" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Enhanced Mobile Features */}
        <meta name="format-detection" content="telephone=yes, date=no, address=yes, email=yes, url=yes" />
        <meta name="theme-color" content="#16A085" />
        
        {/* Performance Optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.taska.co.za" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//api.taska.co.za" />
        
        {/* South African Context */}
        <meta name="geo.region" content="ZA" />
        <meta name="geo.country" content="South Africa" />
        <meta name="geo.placename" content="South Africa" />
        <meta name="ICBM" content="-26.2041,28.0473" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Taska',
              url: 'https://taska.co.za',
              description: 'Connect with skilled artisans for all your service needs in South Africa',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'ZAR'
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '1250'
              },
              author: {
                '@type': 'Organization',
                name: 'Taska',
                url: 'https://taska.co.za'
              }
            })
          }}
        />
        
        {/* Service Worker Registration and Network Status */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Service Worker Registration - suppress errors for missing sw.js
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      // Silently fail in development - service worker is optional
                      // Only log errors in production
                      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                        console.log('SW registration failed: ', registrationError);
                      }
                    });
                });
              }

              // Network status indicator
              function updateNetworkStatus() {
                const indicator = document.getElementById('network-status');
                if (indicator) {
                  if (navigator.onLine) {
                    indicator.classList.add('hidden');
                  } else {
                    indicator.innerHTML = '<div class="bg-red-500 text-white px-3 py-1 rounded-md text-sm">Offline</div>';
                    indicator.classList.remove('hidden');
                  }
                }
              }

              window.addEventListener('online', updateNetworkStatus);
              window.addEventListener('offline', updateNetworkStatus);
              window.addEventListener('load', updateNetworkStatus);
            `
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <WebSocketProvider>
                <ToastProvider />
                <div className="relative flex min-h-screen flex-col bg-cream-50">
                {/* Skip to main content for accessibility */}
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md focus:shadow-lg"
                >
                  Skip to main content
                </a>
                
                <main id="main-content" className="flex-1">
                  {children}
                </main>

                <Footer />

                {/* PWA Install Prompt - Removed inline handlers, will be handled by client component if needed */}

                {/* Network Status Indicator */}
                <div id="network-status" className="fixed bottom-4 right-4 z-50 hidden" />
                </div>
              </WebSocketProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
