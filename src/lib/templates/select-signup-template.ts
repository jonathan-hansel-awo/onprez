import type { BusinessCategory } from '@prisma/client'
import {
  createCanonicalPresencePageContent,
  type CanonicalPresencePage,
} from '@/lib/templates/canonical-template-engine'

export type SelectedSignupTemplate = CanonicalPresencePage

export function createSelectedSignupPresencePageContent(
  businessName: string,
  category: BusinessCategory,
  templateSlug?: string | null
): SelectedSignupTemplate {
  return createCanonicalPresencePageContent(businessName, category, templateSlug, {
    mode: 'account',
  })
}
