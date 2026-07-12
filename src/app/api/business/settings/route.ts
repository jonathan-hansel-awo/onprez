import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { updateBusinessSchema, businessSettingsQuerySchema } from '@/lib/validation/business'
import { DEFAULT_BUSINESS_SETTINGS } from '@/types/business'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import {
  resolveReadableBusinessContext,
  resolveWritableBusinessContext,
} from '@/lib/auth/business-route-utils'

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  return forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : realIp || 'unknown'
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'all'
    const businessId = searchParams.get('businessId')

    const queryValidation = businessSettingsQuerySchema.safeParse({ section })

    if (!queryValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query', details: queryValidation.error.issues },
        { status: 400 }
      )
    }

    const context = await resolveReadableBusinessContext(user.id, businessId || request)

    const business = await prisma.business.findUnique({
      where: { id: context.businessId },
      include: {
        businessHours:
          section === 'all' || section === 'hours'
            ? {
                orderBy: { dayOfWeek: 'asc' },
              }
            : false,
      },
    })

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const settings = {
      ...DEFAULT_BUSINESS_SETTINGS,
      ...toRecord(business.settings),
    }

    let responseData: Record<string, unknown>

    switch (section) {
      case 'profile':
        responseData = {
          id: business.id,
          name: business.name,
          slug: business.slug,
          category: business.category,
          description: business.description,
          tagline: business.tagline,
          email: business.email,
          phone: business.phone,
          website: business.website,
          address: business.address,
          city: business.city,
          state: business.state,
          zipCode: business.zipCode,
          country: business.country,
          timezone: business.timezone,
          isPublished: business.isPublished,
        }
        break

      case 'settings':
        responseData = { settings }
        break

      case 'branding':
        responseData = {
          branding: business.branding || {},
          logoUrl: business.logoUrl,
          coverImageUrl: business.coverImageUrl,
        }
        break

      case 'social':
        responseData = { socialLinks: business.socialLinks || {} }
        break

      case 'hours':
        responseData = { businessHours: business.businessHours || [] }
        break

      default:
        responseData = {
          id: business.id,
          name: business.name,
          slug: business.slug,
          category: business.category,
          description: business.description,
          tagline: business.tagline,
          email: business.email,
          phone: business.phone,
          website: business.website,
          address: business.address,
          city: business.city,
          state: business.state,
          zipCode: business.zipCode,
          country: business.country,
          timezone: business.timezone,
          isPublished: business.isPublished,
          branding: business.branding || {},
          logoUrl: business.logoUrl,
          coverImageUrl: business.coverImageUrl,
          socialLinks: business.socialLinks || {},
          settings,
          businessHours: business.businessHours || [],
        }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...responseData,
        access: {
          role: context.role,
          isOwner: context.isOwner,
        },
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get business settings error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined

    const validation = updateBusinessSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const context = await resolveWritableBusinessContext(user.id, businessId || request)
    const { profile, settings, socialLinks, branding } = validation.data

    const existingBusiness = await prisma.business.findUnique({
      where: { id: context.businessId },
      select: {
        id: true,
        settings: true,
        socialLinks: true,
        branding: true,
      },
    })

    if (!existingBusiness) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (profile) Object.assign(updateData, profile)

    if (settings) {
      updateData.settings = {
        ...toRecord(existingBusiness.settings),
        ...settings,
      }
    }

    if (socialLinks) {
      updateData.socialLinks = {
        ...toRecord(existingBusiness.socialLinks),
        ...socialLinks,
      }
    }

    if (branding) {
      updateData.branding = {
        ...toRecord(existingBusiness.branding),
        ...branding,
      }
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: existingBusiness.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        tagline: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        timezone: true,
        isPublished: true,
        branding: true,
        logoUrl: true,
        coverImageUrl: true,
        socialLinks: true,
        settings: true,
        updatedAt: true,
      },
    })

    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'business_settings_updated',
        details: {
          businessId: updatedBusiness.id,
          updatedFields: Object.keys(updateData),
        },
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent') || undefined,
        severity: 'info',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        business: updatedBusiness,
        access: {
          role: context.role,
          isOwner: context.isOwner,
        },
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Update business settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

export const PATCH = PUT
