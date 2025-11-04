import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ['/account', '/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Check for access token in cookies or Authorization header
  const accessToken =
    request.cookies.get('accessToken')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const tokenPayload = await verifyToken(accessToken)

  if (!tokenPayload) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    loginUrl.searchParams.set('session_expired', 'true')
    return NextResponse.redirect(loginUrl)
  }

  // Add user info to headers for consumption by pages
  const response = NextResponse.next()
  response.headers.set('x-user-id', tokenPayload.payload.userId)
  response.headers.set('x-user-email', tokenPayload.payload.email)

  return response
}

export const config = {
  matcher: ['/account/:path*', '/dashboard/:path*'],
}
