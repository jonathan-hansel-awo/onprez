import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/dashboard',
    name: 'OnPrez',
    short_name: 'OnPrez',
    description:
      'Build a memorable online presence, showcase your services, share availability, and take bookings from one OnPrez handle.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#F7F7FF',
    theme_color: '#2563EB',
    categories: ['business', 'productivity'],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Open your OnPrez dashboard',
        url: '/dashboard',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Bookings',
        short_name: 'Bookings',
        description: 'View and manage your bookings',
        url: '/dashboard/bookings',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
