import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { generateVerificationToken } from '@/lib/utils/token'
import { sendVerificationEmail } from '@/lib/services/email'
import { logSecurityEvent } from '@/lib/services/security-logging'
import type { SignupInput } from '@/lib/validation/auth'
import { env } from '@/lib/config/env'

export interface SignupResult {
  success: boolean
  userId?: string
  businessId?: string
  email?: string
  handle?: string
  requiresVerification: boolean
  error?: string
}

/**
 * Sign up a new user with business
 */
export async function signupUser(
  data: SignupInput,
  ipAddress: string,
  userAgent?: string
): Promise<SignupResult> {
  try {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingEmail) {
      return {
        success: false,
        requiresVerification: false,
        error: 'Email address is already registered',
      }
    }

    // Check if handle already exists
    const existingHandle = await prisma.business.findUnique({
      where: { slug: data.handle },
    })

    if (existingHandle) {
      return {
        success: false,
        requiresVerification: false,
        error: 'This handle is already taken',
      }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    // Generate verification token
    const { token: verificationToken, expiresAt: verificationExpiresAt } =
      generateVerificationToken()

    // Create user and business in a transaction
    const result = await prisma.$transaction(async tx => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          emailVerified: false,
        },
      })

      // Create email verification token
      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          email: data.email,
          expiresAt: verificationExpiresAt,
        },
      })

      // Create business
      const business = await tx.business.create({
        data: {
          ownerId: user.id,
          name: data.businessName,
          slug: data.handle,
          category: data.businessCategory,
          description: '',
          isActive: true,
        },
      })

      return { user, business }
    })

    // Send verification email
    const verificationUrl = `${env.APP_URL || env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`

    await sendVerificationEmail(data.email, verificationUrl, data.businessName)

    // Log security event
    await logSecurityEvent({
      userId: result.user.id,
      action: 'user_signup',
      details: {
        email: data.email,
        businessId: result.business.id,
        handle: data.handle,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Signup error:', error)

    // Log failed signup attempt
    await logSecurityEvent({
      action: 'user_signup_failed',
      details: {
        email: data.email,
        error: error.message,
      },
      ipAddress,
      userAgent,
      severity: 'warning',
    })

    return {
      success: false,
      requiresVerification: false,
      error: 'Failed to create account. Please try again.',
    }
  }
}

/**
 * Check if handle is available
 */
export async function checkHandleAvailability(handle: string): Promise<{
  available: boolean
  reason?: string
}> {
  // Normalize handle
  const normalizedHandle = handle.toLowerCase().trim()

  // Check if handle exists
  const existing = await prisma.business.findUnique({
    where: { slug: normalizedHandle },
  })

  console.log('✅ Query result:', existing)

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
