/**
 * @jest-environment node
 */

import { proxy } from '@/proxy'
import { NextRequest } from 'next/server'

function createRequest(path: string, cookie?: string) {
  const headers = new Headers()

  if (cookie) {
    headers.set('cookie', cookie)
  }

  return new NextRequest(`http://localhost:3000${path}`, {
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
