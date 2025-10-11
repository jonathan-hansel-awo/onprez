import { Button } from '@/components/ui/button'
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">OnPrez</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground font-medium transition"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground font-medium transition"
            >
              How It Works
            </a>

            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground font-medium transition"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <DarkModeToggle />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign In
            </Button>
            <Button size="sm" className="whitespace-nowrap">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
