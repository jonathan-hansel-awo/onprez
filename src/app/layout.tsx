import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SmoothScroll } from '@/components/ui/smooth-scroll'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
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
  authors: [{ name: 'OnPrez' }],
  creator: 'OnPrez',
  publisher: 'OnPrez',
  metadataBase: new URL('https://onprez.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'OnPrez - Your Complete Online Presence',
    description:
      'Create your customizable presence page with integrated booking. Perfect for service professionals.',
    url: 'https://onprez.vercel.app',
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
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  )
}
