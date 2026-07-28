import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './legal.css'
import { SmoothScroll } from '@/components/ui/smooth-scroll'
import { ErrorBoundary } from '@/components/error-boundary'
import { PreloadResources } from '@/components/preload-resources'
import { AnalyticsWrapper } from '@/components/analytics/analytics-wrapper'
import { CookieConsentBanner } from '@/components/privacy/cookie-consent-banner'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

const siteTitle = 'OnPrez — Your Online Presence, with Bookings Built In'
const siteDescription =
  'Build a memorable online presence, showcase your services, share availability, and take bookings from one OnPrez handle.'

export const viewport: Viewport = {
  themeColor: '#2563EB',
  colorScheme: 'light',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://onprez.com'),
  applicationName: 'OnPrez',
  title: {
    default: siteTitle,
    template: '%s | OnPrez',
  },
  description: siteDescription,
  keywords: [
    'online presence',
    'service business website',
    'online booking',
    'appointment scheduling',
    'service professionals',
    'business page',
    'OnPrez handle',
  ],
  authors: [{ name: 'Jonathan Hansel Awo' }],
  creator: 'Jonathan Hansel Awo',
  publisher: 'OnPrez',
  category: 'business',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: '/',
    siteName: 'OnPrez',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'OnPrez — your online presence, with bookings built in',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-GB" className={`scroll-smooth ${inter.variable}`}>
      <head>
        <PreloadResources />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <ErrorBoundary>
            <SmoothScroll>
              {children}
              <AnalyticsWrapper />
            </SmoothScroll>
            <CookieConsentBanner />
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}
