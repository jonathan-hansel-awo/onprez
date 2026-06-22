import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { generateVerificationToken } from '@/lib/utils/token'
import { sendVerificationEmail } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import { RESERVED_HANDLES, type SignupInput } from '@/lib/validation/auth'
import { env } from '@/lib/config/env'
import { createDefaultPresencePageContent } from '@/lib/utils/default-presence-page'
import { Prisma } from '@prisma/client'
import { hashEmailVerificationToken } from '@/lib/services/email-verification'

export interface SignupResult {
  success: boolean
  userId?: string
  businessId?: string
  email?: string
  handle?: string
  requiresVerification: boolean
  error?: string
}

const HANDLE_REGEX = /^[a-z0-9-]+$/

async function logSecurityEventSafely(event: Parameters<typeof logSecurityEvent>[0]) {
  try {
    await logSecurityEvent(event)
  } catch (error) {
    console.error('Security logging failed:', error)
  }
}

function getAppBaseUrl() {
  return env.APP_URL || env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function mapSignupError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return 'Account could not be created because one of the details is already in use.'
  }

  return 'Failed to create account. Please try again.'
}

/**
 * Sign up a new user with business.
 */
export async function signupUser(
  data: SignupInput,
  ipAddress: string,
  userAgent?: string
): Promise<SignupResult> {
  const email = data.email.toLowerCase().trim()
  const handle = data.handle.toLowerCase().trim()
  const businessName = data.businessName.trim()
  const businessCategory = data.businessCategory

  try {
    if (handle.length < 3 || handle.length > 30 || !HANDLE_REGEX.test(handle)) {
      return {
        success: false,
        requiresVerification: false,
        error: 'Invalid handle',
      }
    }

    if (RESERVED_HANDLES.includes(handle as (typeof RESERVED_HANDLES)[number])) {
      return {
        success: false,
        requiresVerification: false,
        error: 'This handle is reserved',
      }
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingEmail) {
      return {
        success: false,
        requiresVerification: false,
        error: 'Email address is already registered',
      }
    }

    const existingHandle = await prisma.business.findUnique({
      where: { slug: handle },
      select: { id: true },
    })

    if (existingHandle) {
      return {
        success: false,
        requiresVerification: false,
        error: 'This handle is already taken',
      }
    }

    const passwordHash = await hashPassword(data.password)

    const { token: verificationToken, expiresAt: verificationExpiresAt } =
      generateVerificationToken()

    const hashedVerificationToken = hashEmailVerificationToken(verificationToken)

    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          emailVerified: false,
        },
      })

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: hashedVerificationToken,
          email,
          expiresAt: verificationExpiresAt,
        },
      })

      const business = await tx.business.create({
        data: {
          ownerId: user.id,
          name: businessName,
          slug: handle,
          category: businessCategory,
          description: '',
          isActive: true,
        },
      })

      const defaultContent = createDefaultPresencePageContent(businessName, businessCategory)

      await tx.page.create({
        data: {
          businessId: business.id,
          slug: 'home',
          title: `${businessName} - Home`,
          isPublished: false,
          order: 0,
          content: defaultContent as unknown as Prisma.InputJsonValue,
          metaTitle: `${businessName} | OnPrez`,
          metaDescription: `Welcome to ${businessName}. Book your appointment online today.`,
        },
      })

      return { user, business }
    })

    const verificationUrl = `${getAppBaseUrl()}/verify-email?token=${verificationToken}`

    try {
      await sendVerificationEmail(email, verificationUrl, businessName)
    } catch (error) {
      // Account exists at this point. Do not report signup failure;
      // user can request a fresh verification email.
      console.error('Signup verification email failed:', error)

      await logSecurityEventSafely({
        userId: result.user.id,
        action: 'signup_verification_email_failed',
        details: {
          businessId: result.business.id,
          handle,
        },
        ipAddress,
        userAgent,
        severity: 'warning',
      })
    }

    await logSecurityEventSafely({
      userId: result.user.id,
      action: 'user_signup',
      details: {
        businessId: result.business.id,
        handle,
      },
      ipAddress,
      userAgent,
      severity: 'info',
    })

    return {
      success: true,
      userId: result.user.id,
      businessId: result.business.id,
      email: result.user.email,
      handle: result.business.slug,
      requiresVerification: true,
    }
  } catch (error) {
    console.error('Signup error:', error)

    await logSecurityEventSafely({
      action: 'user_signup_failed',
      details: {
        reason: 'signup_failed',
      },
      ipAddress,
      userAgent,
      severity: 'warning',
    })

    return {
      success: false,
      requiresVerification: false,
      error: mapSignupError(error),
    }
  }
}

/**
 * Check if handle is available.
 */
export async function checkHandleAvailability(handle: string): Promise<{
  available: boolean
  reason?: string
}> {
  const normalizedHandle = handle.toLowerCase().trim()

  if (
    normalizedHandle.length < 3 ||
    normalizedHandle.length > 30 ||
    !HANDLE_REGEX.test(normalizedHandle)
  ) {
    return {
      available: false,
      reason: 'Invalid handle',
    }
  }

  if (RESERVED_HANDLES.includes(normalizedHandle as (typeof RESERVED_HANDLES)[number])) {
    return {
      available: false,
      reason: 'This handle is reserved',
    }
  }

  const existing = await prisma.business.findUnique({
    where: { slug: normalizedHandle },
    select: { id: true },
  })

  if (existing) {
    return {
      available: false,
      reason: 'Handle is already taken',
    }
  }

  return {
    available: true,
  }
}
