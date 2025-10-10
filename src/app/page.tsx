import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
           {/* Dark mode toggle in top-right corner */}
      <DarkModeToggle />
      
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-6">
          Hello from  OnPrez! 🚀
        </h1>
        <p className="text-xl mb-8 text-muted-foreground">
          Welcome to your digital identity platform with integrated booking.
        </p>
        
        {/* Showcase Button Components */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <p className="mb-4">This is the beginning of something amazing...</p>
          <ul className="text-left space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Next.js 14 with App Router
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              TypeScript configured
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Tailwind CSS ready
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Shadcn/ui components
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Dark mode support
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Ready for development
            </li>
          </ul>
        </div>

        <div className="mt-8">
          <Button size="lg" className="mr-4">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </main>
  );
}