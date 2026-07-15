import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/account']
const safeApiMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(route => matchesRoute(pathname, route))
}

function isStateChangingApiRequest(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname === '/api' || pathname.startsWith('/api/')

  return isApiRoute && !safeApiMethods.has(request.method.toUpperCase())
}

function firstForwardedValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null
}

function getTargetOrigin(request: NextRequest) {
  const forwardedHost = firstForwardedValue(request.headers.get('x-forwarded-host'))
  const host = forwardedHost || request.headers.get('host')
  const forwardedProtocol = firstForwardedValue(request.headers.get('x-forwarded-proto'))
  const protocol = forwardedProtocol || request.nextUrl.protocol.replace(':', '')

  if (!host) {
    return request.nextUrl.origin
  }

  try {
    return new URL(`${protocol}://${host}`).origin
  } catch {
    return request.nextUrl.origin
  }
}

function getSourceOrigin(request: NextRequest) {
  const source = request.headers.get('origin') || request.headers.get('referer')

  if (!source || source === 'null') {
    return source
  }

  try {
    return new URL(source).origin
  } catch {
    return null
  }
}

function isCsrfSafe(request: NextRequest) {
  const fetchSite = request.headers.get('sec-fetch-site')?.toLowerCase()

  // Treat sibling subdomains as untrusted too. A compromised or user-controlled
  // subdomain must not be able to mutate the main application.
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') {
    return false
  }

  const sourceOrigin = getSourceOrigin(request)

  if (sourceOrigin === null) {
    return false
  }

  if (sourceOrigin) {
    return sourceOrigin === getTargetOrigin(request)
  }

  // Modern browsers send Origin and Fetch Metadata on unsafe cross-origin
  // requests. Requests without browser metadata are retained for trusted
  // server-to-server and CLI clients, which do not automatically attach cookies.
  return fetchSite === undefined || fetchSite === 'same-origin' || fetchSite === 'none'
}

function csrfRejectedResponse() {
  return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)

  const redirectPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  loginUrl.searchParams.set('redirect', redirectPath)

  return NextResponse.redirect(loginUrl)
}

export async function proxy(request: NextRequest) {
  const stateChangingApiRequest = isStateChangingApiRequest(request)

  try {
    if (stateChangingApiRequest && !isCsrfSafe(request)) {
      return csrfRejectedResponse()
    }

    const { pathname } = request.nextUrl

    // Only explicitly protected page routes need auth at this proxy layer.
    // API authorization remains the responsibility of each route handler.
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

    // Fail closed for protected pages and unsafe API mutations.
    if (stateChangingApiRequest) {
      return csrfRejectedResponse()
    }

    if (isProtectedRoute(request.nextUrl.pathname)) {
      return redirectToLogin(request)
    }

    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match page and API requests except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - common public image assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)',
  ],
}
