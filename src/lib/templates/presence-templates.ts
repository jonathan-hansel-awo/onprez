import type { BusinessCategory } from '@prisma/client'
import { presenceTemplateCatalogue } from '@/data/presence-template-catalogue'
import {
  createCanonicalPresencePageContent,
  getCanonicalTemplateThumbnail,
} from '@/lib/templates/canonical-template-engine'
import type { PresenceTemplate, PresenceTemplateCategory } from '@/types/templates'

export const TEMPLATE_CATEGORIES: Record<PresenceTemplateCategory, string> = {
  wellness: 'Wellness',
  beauty: 'Beauty',
  fitness: 'Fitness',
  professional: 'Professional',
  creative: 'Creative',
  education: 'Education',
}

const categoryMap = {
  WELLNESS: 'wellness',
  BEAUTY: 'beauty',
  FITNESS: 'fitness',
  PROFESSIONAL: 'professional',
  CREATIVE: 'creative',
  EDUCATION: 'education',
} as const satisfies Record<string, PresenceTemplateCategory>

const legacyTemplateIds: Record<string, string> = {
  'modern-default': 'serene-wellness',
  'classic-elegant': 'heavenly-pamper-palace',
  'minimal-clean': 'clear-professional',
  'creative-vibrant': 'frame-creative',
  'professional-corporate': 'clear-professional',
}

export const PRESENCE_TEMPLATES: PresenceTemplate[] = presenceTemplateCatalogue.map(template => {
  const canonical = createCanonicalPresencePageContent(
    template.preview.businessName,
    'OTHER' as BusinessCategory,
    template.slug,
    { mode: 'preview' }
  )

  return {
    id: template.slug,
    name: template.name,
    description: template.description,
    category: categoryMap[template.category],
    thumbnail: getCanonicalTemplateThumbnail(template.slug),
    previewHref: `/templates/${template.slug}?view=client`,
    isDefault: template.slug === 'serene-wellness',
    content: {
      sections: canonical.sections,
      theme: canonical.theme,
    },
  }
})

export function getTemplateById(id: string): PresenceTemplate | undefined {
  const canonicalId = legacyTemplateIds[id] || id
  return PRESENCE_TEMPLATES.find(template => template.id === canonicalId)
}

export function getDefaultTemplate(): PresenceTemplate {
  return PRESENCE_TEMPLATES.find(template => template.isDefault) || PRESENCE_TEMPLATES[0]
}
