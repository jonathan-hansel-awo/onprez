import type { BusinessCategory } from '@prisma/client'
import type { AppliedSignupTemplate } from '@/lib/templates/apply-signup-template'
import { createSignupPresencePageContent } from '@/lib/templates/apply-signup-template'
import { createEditorialBeautySections } from '@/lib/templates/editorial-beauty-sections'

export interface SelectedSignupTemplate extends Omit<AppliedSignupTemplate, 'theme'> {
  theme?: NonNullable<AppliedSignupTemplate['theme']> & {
    headingFont?: string
    buttonStyle?: 'rounded' | 'square' | 'pill'
    spacing?: 'compact' | 'normal' | 'relaxed'
  }
}

export function createSelectedSignupPresencePageContent(
  businessName: string,
  category: BusinessCategory,
  templateSlug?: string | null
): SelectedSignupTemplate {
  const applied = createSignupPresencePageContent(businessName, category, templateSlug)

  if (applied.templateSlug !== 'editorial-beauty' || !applied.theme) {
    return applied
  }

  return {
    ...applied,
    sections: createEditorialBeautySections(businessName),
    theme: {
      ...applied.theme,
      fontFamily: 'Inter',
      headingFont: 'Georgia',
      buttonStyle: 'square',
      spacing: 'relaxed',
    },
  }
}
