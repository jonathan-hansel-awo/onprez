import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/account']

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(route => matchesRoute(pathname, route))
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)

  const redirectPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  loginUrl.searchParams.set('redirect', redirectPath)

  return NextResponse.redirect(loginUrl)
}

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Only explicitly protected routes need auth at this proxy layer.
    // Everything else is public unless protected elsewhere.
    if (!isProtectedRoute(pathname)) {
      return NextResponse.next()
    }

    const accessToken = request.cookies.get('accessToken')?.value?.trim()

    if (!accessToken) {
      return redirectToLogin(request)
    }

    // Important:
    // This only checks that a token exists.
    // The dashboard/account pages must still validate the token server-side.
    return NextResponse.next()
  } catch (error) {
    console.error('Proxy error:', error)

    // Fail closed for protected routes.
    // If proxy logic breaks, do not accidentally expose dashboard/account pages.
    if (isProtectedRoute(request.nextUrl.pathname)) {
      return redirectToLogin(request)
    }

    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - common public image assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)',
  ],
}
