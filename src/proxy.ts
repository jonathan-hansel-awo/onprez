import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/account']
const safeApiMethods = new Set(['GET', 'HEAD', 'OPTIONS'])
const SAFE_TRACE_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/

function safeTraceId(value: string | null) {
  const candidate = value?.trim()
  return candidate && SAFE_TRACE_ID_PATTERN.test(candidate) ? candidate : undefined
}

function getTraceIds(request: NextRequest) {
  const requestId = safeTraceId(request.headers.get('x-request-id')) || crypto.randomUUID()
  const correlationId = safeTraceId(request.headers.get('x-correlation-id')) || requestId
  return { requestId, correlationId }
}

function addTraceHeaders(
  response: NextResponse,
  trace: { requestId: string; correlationId: string }
) {
  response.headers.set('x-request-id', trace.requestId)
  response.headers.set('x-correlation-id', trace.correlationId)
  return response
}

function continueWithTrace(
  request: NextRequest,
  trace: { requestId: string; correlationId: string }
) {
  const headers = new Headers(request.headers)
  headers.set('x-request-id', trace.requestId)
  headers.set('x-correlation-id', trace.correlationId)
  return addTraceHeaders(NextResponse.next({ request: { headers } }), trace)
}

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

  if (!source) {
    return undefined
  }

  if (source === 'null') {
    return null
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
  const trace = getTraceIds(request)

  try {
    if (stateChangingApiRequest && !isCsrfSafe(request)) {
      return addTraceHeaders(csrfRejectedResponse(), trace)
    }

    const { pathname } = request.nextUrl

    // Only explicitly protected page routes need auth at this proxy layer.
    // API authorization remains the responsibility of each route handler.
    if (!isProtectedRoute(pathname)) {
      return continueWithTrace(request, trace)
    }

    const accessToken = request.cookies.get('accessToken')?.value?.trim()

    if (!accessToken) {
      return addTraceHeaders(redirectToLogin(request), trace)
    }

    // Important:
    // This only checks that a token exists.
    // The dashboard/account pages must still validate the token server-side.
    return continueWithTrace(request, trace)
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        service: 'onprez',
        event: 'proxy.failed',
        requestId: trace.requestId,
        correlationId: trace.correlationId,
        method: request.method,
        path: request.nextUrl.pathname,
        errorType: error instanceof Error ? error.name : typeof error,
      })
    )

    // Fail closed for protected pages and unsafe API mutations.
    if (stateChangingApiRequest) {
      return addTraceHeaders(csrfRejectedResponse(), trace)
    }

    if (isProtectedRoute(request.nextUrl.pathname)) {
      return addTraceHeaders(redirectToLogin(request), trace)
    }

    return continueWithTrace(request, trace)
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
