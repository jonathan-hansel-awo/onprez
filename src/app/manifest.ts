import type { MetadataRoute } from 'next'

const pwaIcon = (size: 180 | 192 | 512, maskable = false) =>
  `/icons/onprez-wordmark-${size}${maskable ? '-maskable' : ''}.png`

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
        icons: [{ src: pwaIcon(192), sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Bookings',
        short_name: 'Bookings',
        description: 'View and manage your bookings',
        url: '/dashboard/bookings',
        icons: [{ src: pwaIcon(192), sizes: '192x192', type: 'image/png' }],
      },
    ],
    icons: [
      {
        src: pwaIcon(192),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: pwaIcon(512),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: pwaIcon(512, true),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
