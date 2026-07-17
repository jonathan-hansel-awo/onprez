import type { PageSection, SectionType } from '@/types/page-sections'

export const PRESENCE_TEMPLATE_SCHEMA_VERSION = 1 as const

export type PresenceTemplateCategory =
  | 'WELLNESS'
  | 'BEAUTY'
  | 'FITNESS'
  | 'PROFESSIONAL'
  | 'CREATIVE'
  | 'EDUCATION'

export type PresenceTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type PresenceTemplateCustomisationKey =
  | 'businessName'
  | 'logo'
  | 'images'
  | 'colours'
  | 'typography'
  | 'sectionOrder'
  | 'sectionVisibility'
  | 'sectionContent'
  | 'services'
  | 'contactDetails'
  | 'socialLinks'
  | 'policies'
  | 'faqs'

export type PresenceTemplateProtectedCapability =
  | 'BOOKING_ENTRY'
  | 'SERVICE_DISCOVERY'
  | 'CONTACT_FALLBACK'

export interface PresenceTemplateAsset {
  url: string
  alt: string
  width?: number
  height?: number
}

export interface PresenceTemplateMetadata {
  id: string
  slug: string
  version: number
  schemaVersion: typeof PRESENCE_TEMPLATE_SCHEMA_VERSION
  status: PresenceTemplateStatus
  category: PresenceTemplateCategory
  name: string
  description: string
  thumbnail: PresenceTemplateAsset
  previewImages: PresenceTemplateAsset[]
  tags: string[]
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface PresenceTemplateTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  mutedTextColor: string
  headingFontFamily: string
  bodyFontFamily: string
  borderRadius: string
  sectionSpacing: 'compact' | 'comfortable' | 'spacious'
}

export interface PresenceTemplateCustomisationPolicy {
  allowed: PresenceTemplateCustomisationKey[]
  protectedCapabilities: PresenceTemplateProtectedCapability[]
  requiredSectionTypes: SectionType[]
  warnBeforeHidingSectionTypes: SectionType[]
}

export interface PresenceTemplateDefinition {
  metadata: PresenceTemplateMetadata
  theme: PresenceTemplateTheme
  sections: PageSection[]
  customisation: PresenceTemplateCustomisationPolicy
}

export interface AppliedPresenceTemplateSnapshot {
  templateId: string
  templateSlug: string
  templateVersion: number
  appliedAt: string
  theme: PresenceTemplateTheme
  sections: PageSection[]
}

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Creates an independent snapshot of a template for a business presence.
 * Later catalogue edits do not mutate existing business pages.
 */
export function applyPresenceTemplate(
  template: PresenceTemplateDefinition,
  appliedAt = new Date().toISOString()
): AppliedPresenceTemplateSnapshot {
  return {
    templateId: template.metadata.id,
    templateSlug: template.metadata.slug,
    templateVersion: template.metadata.version,
    appliedAt,
    theme: cloneSerializable(template.theme),
    sections: cloneSerializable(template.sections),
  }
}

export function validatePresenceTemplate(template: PresenceTemplateDefinition): string[] {
  const errors: string[] = []
  const visibleTypes = new Set(
    template.sections.filter(section => section.isVisible).map(section => section.type)
  )

  if (template.metadata.version < 1) {
    errors.push('Template version must be at least 1.')
  }

  if (template.sections.length === 0) {
    errors.push('Template must contain at least one section.')
  }

  for (const sectionType of template.customisation.requiredSectionTypes) {
    if (!visibleTypes.has(sectionType)) {
      errors.push(`Required section type ${sectionType} must be visible.`)
    }
  }

  if (
    template.customisation.protectedCapabilities.includes('BOOKING_ENTRY') &&
    !visibleTypes.has('SERVICES')
  ) {
    errors.push('Templates with protected booking entry must include a visible SERVICES section.')
  }

  return errors
}
