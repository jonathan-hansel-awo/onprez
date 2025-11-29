import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SmoothScroll } from '@/components/ui/smooth-scroll'
import { ErrorBoundary } from '@/components/error-boundary'
import { PreloadResources } from '@/components/preload-resources'
import { AnalyticsWrapper } from '@/components/analytics/analytics-wrapper'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'OnPrez - Your Complete Online Presence',
  description:
    'Create your customizable presence page with integrated booking. Perfect for service professionals. Get started free at onprez.com/yourname',
  keywords: [
    'online presence',
    'booking system',
    'service professionals',
    'custom handle',
    'business page',
  ],
  icons: {
    icon: '/favicon.svg',
  },
  authors: [{ name: 'OnPrez' }],
  creator: 'OnPrez',
  publisher: 'OnPrez',
  metadataBase: new URL('https://onprez.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'OnPrez - Your Complete Online Presence',
    description:
      'Create your customizable presence page with integrated booking. Perfect for service professionals.',
    url: 'https://onprez.com',
    siteName: 'OnPrez',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OnPrez - Your Complete Online Presence',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnPrez - Your Complete Online Presence',
    description:
      'Create your customizable presence page with integrated booking. Perfect for service professionals.',
    images: ['/og-image.png'],
    creator: '@onprez',
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
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
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
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  )
}
