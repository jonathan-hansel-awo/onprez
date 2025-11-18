/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center px-4 max-w-md">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-lg text-gray-600 mb-2">
            This OnPrez page doesn't exist or hasn't been published yet.
          </p>
          <p className="text-sm text-gray-500">
            Double-check the URL or contact the business owner.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/">
            <Button variant="primary" size="lg" className="w-full">
              <Home className="w-5 h-5 mr-2" />
              Go to OnPrez Home
            </Button>
          </Link>

          <p className="text-sm text-gray-500">
            Want your own page?{' '}
            <Link href="/signup" className="text-onprez-blue hover:underline font-medium">
              Create your OnPrez page
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
