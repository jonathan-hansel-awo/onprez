import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/utils/cn';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OnPrez - Smart Booking Solution for Local Businesses',
  description:
    'Accept online bookings with a professional profile page that matches your brand. Set up in minutes, manage appointments effortlessly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen antialiased')}>
        {children}
      </body>
    </html>
  );
}
