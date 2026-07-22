import { NextRequest, NextResponse } from 'next/server'
import { getPresenceTemplate } from '@/data/presence-template-catalogue'
import { normalisePreviewBusinessName } from '@/lib/templates/preview-personalisation'
import { TEMPLATE_SELECTION_COOKIE } from '@/lib/templates/template-selection'

const TEMPLATE_SELECTION_MAX_AGE_SECONDS = 60 * 60

export async function GET(request: NextRequest) {
  const templateSlug = request.nextUrl.searchParams.get('template') || ''
  const template = getPresenceTemplate(templateSlug)

  if (!template) {
    return NextResponse.redirect(new URL('/templates', request.url))
  }

  const signupUrl = new URL('/signup', request.url)
  signupUrl.searchParams.set('template', template.slug)

  const businessName = normalisePreviewBusinessName(
    request.nextUrl.searchParams.get('businessName')
  )

  if (businessName) {
    signupUrl.searchParams.set('businessName', businessName)
  }

  const response = NextResponse.redirect(signupUrl)
  response.cookies.set(TEMPLATE_SELECTION_COOKIE, template.slug, {
    httpOnly: true,
    maxAge: TEMPLATE_SELECTION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
