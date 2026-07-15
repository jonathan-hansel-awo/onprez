/**
 * @jest-environment node
 */

import { config, proxy } from '@/proxy'
import { NextRequest } from 'next/server'

function createRequest(
  path: string,
  cookie?: string,
  init?: ConstructorParameters<typeof NextRequest>[1]
) {
  const headers = new Headers(init?.headers)

  if (cookie) {
    headers.set('cookie', cookie)
  }

  return new NextRequest(`http://localhost:3000${path}`, {
    ...init,
    headers,
  })
}

function createMutationRequest(
  path: string,
  headers?: HeadersInit,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'
) {
  return createRequest(path, undefined, {
    method,
    headers,
  })
}

function expectRedirectToLogin(response: Response, expectedRedirectPath: string) {
  expect(response.status).toBe(307)

  const location = response.headers.get('location')
  expect(location).toBeTruthy()

  const redirectUrl = new URL(location!)
  expect(redirectUrl.pathname).toBe('/login')
  expect(redirectUrl.searchParams.get('redirect')).toBe(expectedRedirectPath)
}

function expectNext(response: Response) {
  expect(response.headers.get('location')).toBeNull()
}

describe('proxy route protection', () => {
  it('allows the homepage through', async () => {
    const response = await proxy(createRequest('/'))

    expectNext(response)
  })

  it('allows auth routes through', async () => {
    const routes = ['/login', '/signup', '/forgot-password', '/reset-password', '/invite']

    for (const route of routes) {
      const response = await proxy(createRequest(route))
      expectNext(response)
    }
  })

  it('redirects /dashboard when there is no accessToken cookie', async () => {
    const response = await proxy(createRequest('/dashboard'))

    expectRedirectToLogin(response, '/dashboard')
  })

  it('redirects nested dashboard routes when there is no accessToken cookie', async () => {
    const response = await proxy(createRequest('/dashboard/settings'))

    expectRedirectToLogin(response, '/dashboard/settings')
  })

  it('preserves query params in the login redirect', async () => {
    const response = await proxy(createRequest('/dashboard/settings?tab=security'))

    expectRedirectToLogin(response, '/dashboard/settings?tab=security')
  })

  it('redirects nested account routes when there is no accessToken cookie', async () => {
    const response = await proxy(createRequest('/account/security'))

    expectRedirectToLogin(response, '/account/security')
  })

  it('does not accidentally protect routes that merely start with the same letters', async () => {
    const response = await proxy(createRequest('/dashboard-preview'))

    expectNext(response)
  })

  it('allows requests with an accessToken cookie through to the server layout for validation', async () => {
    const response = await proxy(createRequest('/dashboard', 'accessToken=fake-token'))

    expectNext(response)
  })
})

describe('proxy CSRF protection', () => {
  it('includes API routes in the proxy matcher', () => {
    expect(config.matcher.join(' ')).not.toContain('?!api')
  })

  it.each([
    '/api/bookings',
    '/api/account/password',
    '/api/business/settings',
    '/api/account/sessions/terminate-all',
  ])('blocks cross-site mutations to %s', async path => {
    const response = await proxy(
      createMutationRequest(path, {
        origin: 'https://attacker.example',
        'sec-fetch-site': 'cross-site',
        'content-type': 'application/x-www-form-urlencoded',
      })
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Forbidden',
    })
  })

  it('blocks mismatched Origin even when Fetch Metadata is unavailable', async () => {
    const response = await proxy(
      createMutationRequest('/api/business/settings', {
        origin: 'https://attacker.example',
      })
    )

    expect(response.status).toBe(403)
  })

  it('blocks opaque origins from sandboxed cross-site documents', async () => {
    const response = await proxy(
      createMutationRequest('/api/bookings', {
        origin: 'null',
      })
    )

    expect(response.status).toBe(403)
  })

  it('does not trust sibling subdomains for mutations', async () => {
    const response = await proxy(
      createMutationRequest('/api/business/settings', {
        origin: 'https://untrusted.onprez.com',
        'sec-fetch-site': 'same-site',
        'x-forwarded-host': 'onprez.com',
        'x-forwarded-proto': 'https',
      })
    )

    expect(response.status).toBe(403)
  })

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)(
    'allows legitimate same-origin %s requests',
    async method => {
      const response = await proxy(
        createMutationRequest(
          '/api/business/settings',
          {
            origin: 'http://localhost:3000',
            'sec-fetch-site': 'same-origin',
          },
          method
        )
      )

      expect(response.status).toBe(200)
      expectNext(response)
    }
  )

  it('uses forwarded host and protocol for the production origin', async () => {
    const response = await proxy(
      createMutationRequest('/api/bookings', {
        origin: 'https://onprez.com',
        'sec-fetch-site': 'same-origin',
        'x-forwarded-host': 'onprez.com',
        'x-forwarded-proto': 'https',
      })
    )

    expect(response.status).toBe(200)
    expectNext(response)
  })

  it('allows non-browser API clients that do not send browser origin metadata', async () => {
    const response = await proxy(
      createMutationRequest('/api/business/settings', {
        authorization: 'Bearer api-token',
        'content-type': 'application/json',
      })
    )

    expect(response.status).toBe(200)
    expectNext(response)
  })

  it('does not apply CSRF checks to safe API methods', async () => {
    const response = await proxy(
      createRequest('/api/business/settings', undefined, {
        headers: {
          origin: 'https://attacker.example',
          'sec-fetch-site': 'cross-site',
        },
      })
    )

    expect(response.status).toBe(200)
    expectNext(response)
  })
})
