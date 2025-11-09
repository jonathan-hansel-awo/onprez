/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { updateBusinessSchema, businessSettingsQuerySchema } from '@/lib/validation/business'
import { DEFAULT_BUSINESS_SETTINGS } from '@/types/business'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'all'

    const queryValidation = businessSettingsQuerySchema.safeParse({ section })
    if (!queryValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query', details: queryValidation.error.issues },
        { status: 400 }
      )
    }

    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
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

    const settings = { ...DEFAULT_BUSINESS_SETTINGS, ...((business.settings as object) || {}) }

    let responseData: any = {}

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
        responseData = { ...business, settings, businessHours: business.businessHours || [] }
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
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
    const validation = updateBusinessSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { profile, settings, socialLinks, branding } = validation.data

    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: user.id },
    })

    if (!existingBusiness) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (profile) Object.assign(updateData, profile)
    if (settings) {
      updateData.settings = { ...((existingBusiness.settings as object) || {}), ...settings }
    }
    if (socialLinks) {
      updateData.socialLinks = {
        ...((existingBusiness.socialLinks as object) || {}),
        ...socialLinks,
      }
    }
    if (branding) {
      updateData.branding = { ...((existingBusiness.branding as object) || {}), ...branding }
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: existingBusiness.id },
      data: updateData,
    })

    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'business_settings_updated',
        details: { businessId: updatedBusiness.id, updatedFields: Object.keys(updateData) },
        ipAddress:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        severity: 'info',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedBusiness,
    })
  } catch (error) {
    console.error('Update business settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

export const PATCH = PUT
