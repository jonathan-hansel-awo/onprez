import Link from 'next/link'
import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Logo */}
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center">
          <div className="text-2xl font-bold text-blue-600">OnPrez</div>
        </Link>
      </div>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
