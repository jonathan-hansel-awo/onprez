import { Prisma } from '@prisma/client'
import { checkRateLimit } from '@/lib/services/rate-limit'
import { signupUser } from '@/lib/services/signup'
import { signupSchema } from '@/lib/validation/auth'
import { NextRequest, NextResponse } from 'next/server'
import { apiError, logApiError } from '@/lib/api/error-response'
import { prisma } from '@/lib/prisma'
import { createSelectedSignupPresencePageContent } from '@/lib/templates/select-signup-template'
import { CANONICAL_TEMPLATE_VERSION } from '@/lib/templates/canonical-template-engine'
import { TEMPLATE_SELECTION_COOKIE } from '@/lib/templates/template-selection'

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : realIp || 'unknown'
}

function safeSignupFailureMessage(error?: string) {
  if (!error) {
    return 'Signup failed. Please check your details and try again.'
  }

  const normalized = error.toLowerCase()
  if (normalized.includes('handle')) return 'That handle is not available. Please choose another.'
  if (normalized.includes('email')) return 'This email cannot be used to create an account.'
  if (normalized.includes('password')) return 'Password does not meet the requirements.'

  return 'Signup failed. Please check your details and try again.'
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIp(request)
    const rateLimitKey = `signup:${ipAddress}`
    const rateLimit = await checkRateLimit(rateLimitKey, 'auth:signup')

    if (!rateLimit.allowed) {
      const resetInSeconds = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
      return apiError('RATE_LIMITED', 'Too many signup attempts. Please try again later.', 429, {
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(rateLimit.resetAt.getTime() / 1000).toString(),
          'Retry-After': (rateLimit.retryAfter || resetInSeconds).toString(),
        },
      })
    }

    const body = await request.json()
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
      return apiError('VALIDATION_ERROR', 'Validation failed', 400, {
        details: validation.error.issues.map(error => ({
          field: error.path.join('.'),
          message: error.message,
        })),
      })
    }

    const userAgent = request.headers.get('user-agent') || undefined
    const result = await signupUser(validation.data, ipAddress, userAgent)

    if (!result.success) {
      return apiError('BAD_REQUEST', safeSignupFailureMessage(result.error), 400)
    }

    const requestedTemplateSlug = request.cookies.get(TEMPLATE_SELECTION_COOKIE)?.value
    let appliedTemplateName: string | undefined

    if (result.businessId && requestedTemplateSlug) {
      try {
        const applied = createSelectedSignupPresencePageContent(
          validation.data.businessName.trim(),
          validation.data.businessCategory,
          requestedTemplateSlug
        )

        if (applied.templateSlug && applied.theme) {
          const business = await prisma.business.findUnique({
            where: { id: result.businessId },
            select: { settings: true },
          })
          const currentSettings =
            business?.settings &&
            typeof business.settings === 'object' &&
            !Array.isArray(business.settings)
              ? (business.settings as Prisma.JsonObject)
              : {}

          await prisma.$transaction([
            prisma.page.upsert({
              where: {
                businessId_slug: {
                  businessId: result.businessId,
                  slug: 'home',
                },
              },
              create: {
                businessId: result.businessId,
                slug: 'home',
                title: validation.data.businessName.trim(),
                content: applied.sections as unknown as Prisma.InputJsonValue,
                isPublished: false,
              },
              update: {
                content: applied.sections as unknown as Prisma.InputJsonValue,
              },
            }),
            prisma.business.update({
              where: { id: result.businessId },
              data: {
                settings: {
                  ...currentSettings,
                  presenceTemplateSlug: applied.templateSlug,
                  presenceTemplateVersion: CANONICAL_TEMPLATE_VERSION,
                  theme: applied.theme,
                } as unknown as Prisma.InputJsonValue,
              },
            }),
          ])

          appliedTemplateName = applied.templateName
        }
      } catch (error) {
        logApiError('signup-template-application', error)
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        data: {
          email: result.email,
          handle: result.handle,
          requiresVerification: result.requiresVerification,
          appliedTemplateName,
        },
      },
      { status: 201 }
    )

    response.cookies.set(TEMPLATE_SELECTION_COOKIE, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: true,
    })

    return response
  } catch (error) {
    logApiError('signup-api', error)
    return apiError('INTERNAL_ERROR', 'An error occurred during signup. Please try again.', 500)
  }
}
