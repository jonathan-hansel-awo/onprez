import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Public routes that don't need protection
    const publicRoutes = [
      '/login',
      '/signup',
      '/invite',
      '/forgot-password',
      '/reset-password',
      '/',
    ]

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // Protected routes
    const protectedRoutes = ['/dashboard', '/account']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (!isProtectedRoute || isPublicRoute) {
      return NextResponse.next()
    }

    // Check for access token in cookies
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Let the token validation happen server-side in API routes
    // Edge runtime has limitations, so we just check token existence here
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // On any error, allow the request to continue
    // Let pages/API routes handle auth
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by API middleware)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)',
  ],
}
