import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | OnPrez',
  description: 'Sign in to your OnPrez account to manage your online presence and bookings.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
