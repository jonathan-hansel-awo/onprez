/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

function request(path: string, cookie?: string) {
  const headers = new Headers()
  if (cookie) headers.set('cookie', cookie)
  return new NextRequest(`http://localhost:3000${path}`, { headers })
}

describe('admin route proxy boundary', () => {
  it('redirects anonymous requests to login with the intended admin path', async () => {
    const response = await proxy(request('/admin/businesses/business-1'))
    const location = response.headers.get('location')

    expect(response.status).toBe(307)
    expect(location).toBeTruthy()

    const redirectUrl = new URL(location!)
    expect(redirectUrl.pathname).toBe('/login')
    expect(redirectUrl.searchParams.get('redirect')).toBe('/admin/businesses/business-1')
  })

  it('passes token-bearing requests to the server-side admin role guard', async () => {
    const response = await proxy(request('/admin', 'accessToken=fake-token'))

    expect(response.headers.get('location')).toBeNull()
  })
})
