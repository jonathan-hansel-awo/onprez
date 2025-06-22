import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold">OnPrez</h1>
          <nav className="ml-auto flex gap-6">
            <Link
              href={ROUTES.LOGIN}
              className="text-sm font-medium hover:underline"
            >
              Login
            </Link>
            <Link
              href={ROUTES.SIGNUP}
              className="text-sm font-medium hover:underline"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Smart Booking Solution for Local Businesses
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Accept online bookings with a professional profile page that matches
            your brand. Set up in minutes, manage appointments effortlessly.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <Link
              href={ROUTES.SIGNUP}
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Start Taking Bookings
            </Link>
            <Link
              href="#features"
              className="text-sm font-semibold hover:underline"
            >
              See How It Works →
            </Link>
          </div>
        </section>

        <section id="features" className="border-t py-24">
          <div className="container mx-auto px-4">
            <h3 className="text-center text-3xl font-bold">
              Everything You Need to Manage Bookings
            </h3>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 p-3">
                  {/* Calendar icon placeholder */}
                  <div className="h-full w-full rounded bg-primary/50" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">Smart Scheduling</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Let customers book appointments 24/7. Set your availability
                  and let the system handle the rest.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 p-3">
                  {/* Brand icon placeholder */}
                  <div className="h-full w-full rounded bg-primary/50" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">
                  Your Brand, Your Way
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Customize your booking page to match your brand. Add your
                  logo, colors, and service details.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 p-3">
                  {/* Dashboard icon placeholder */}
                  <div className="h-full w-full rounded bg-primary/50" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">Easy Management</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Track appointments, manage customers, and grow your business
                  from one simple dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 OnPrez. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
