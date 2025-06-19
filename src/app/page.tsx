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
            Professional Websites for Local Businesses
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Create your business website with integrated booking in under 15
            minutes. No technical skills required.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <Link
              href={ROUTES.SIGNUP}
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Get Started Free
            </Link>
            <Link
              href="#features"
              className="text-sm font-semibold hover:underline"
            >
              Learn More →
            </Link>
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
