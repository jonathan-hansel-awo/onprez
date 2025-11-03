import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Your Account | OnPrez',
  description:
    'Join thousands of professionals. Create your complete online presence in 15 minutes. No website needed.',
  openGraph: {
    title: 'Create Your OnPrez Account',
    description: 'Get your own digital presence at onprez.com/yourname',
    images: ['/og-signup.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Your OnPrez Account',
    description: 'Get your own digital presence at onprez.com/yourname',
    images: ['/og-signup.png'],
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
