import type { BusinessCategory } from '@prisma/client'
import {
  createCanonicalPresencePageContent,
  type CanonicalPresencePage,
} from '@/lib/templates/canonical-template-engine'

export type AppliedSignupTemplate = CanonicalPresencePage

export function createSignupPresencePageContent(
  businessName: string,
  category: BusinessCategory,
  templateSlug?: string | null
): AppliedSignupTemplate {
  return createCanonicalPresencePageContent(businessName, category, templateSlug, {
    mode: 'account',
  })
}
