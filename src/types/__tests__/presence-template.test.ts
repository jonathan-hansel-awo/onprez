import type { PresenceTemplateDefinition } from '@/types/presence-template'
import {
  applyPresenceTemplate,
  PRESENCE_TEMPLATE_SCHEMA_VERSION,
  validatePresenceTemplate,
} from '@/types/presence-template'

const template: PresenceTemplateDefinition = {
  metadata: {
    id: 'template-wellness-001',
    slug: 'serene-wellness',
    version: 1,
    schemaVersion: PRESENCE_TEMPLATE_SCHEMA_VERSION,
    status: 'PUBLISHED',
    category: 'WELLNESS',
    name: 'Serene Wellness',
    description: 'A calm, image-led wellness presence.',
    thumbnail: {
      url: '/templates/serene-wellness/thumbnail.webp',
      alt: 'Serene Wellness template preview',
    },
    previewImages: [],
    tags: ['massage', 'spa', 'wellness'],
    isFeatured: true,
    createdAt: '2026-07-17T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
  },
  theme: {
    primaryColor: '#6B705C',
    secondaryColor: '#DDBEA9',
    accentColor: '#B7B7A4',
    backgroundColor: '#FFF8F0',
    textColor: '#2F312B',
    mutedTextColor: '#686B61',
    headingFontFamily: 'Cormorant Garamond',
    bodyFontFamily: 'Inter',
    borderRadius: '1rem',
    sectionSpacing: 'spacious',
  },
  sections: [
    {
      id: 'hero',
      type: 'HERO',
      order: 0,
      isVisible: true,
      data: {
        title: 'Restore. Relax. Reconnect.',
      },
    },
    {
      id: 'services',
      type: 'SERVICES',
      order: 1,
      isVisible: true,
      data: {
        title: 'Treatments',
        layout: 'grid',
        showPrices: true,
      },
    },
  ],
  customisation: {
    allowed: ['businessName', 'images', 'colours', 'services'],
    protectedCapabilities: ['BOOKING_ENTRY', 'SERVICE_DISCOVERY'],
    requiredSectionTypes: ['HERO', 'SERVICES'],
    warnBeforeHidingSectionTypes: ['SERVICES'],
  },
}

describe('presence template data model', () => {
  it('creates an independent copy when applying a template', () => {
    const applied = applyPresenceTemplate(template, '2026-07-17T12:00:00.000Z')

    applied.theme.primaryColor = '#000000'
    applied.sections[0].isVisible = false

    expect(template.theme.primaryColor).toBe('#6B705C')
    expect(template.sections[0].isVisible).toBe(true)
    expect(applied.templateVersion).toBe(1)
    expect(applied.appliedAt).toBe('2026-07-17T12:00:00.000Z')
  })

  it('accepts a valid conversion-safe template', () => {
    expect(validatePresenceTemplate(template)).toEqual([])
  })

  it('rejects a template that hides a required section', () => {
    const invalidTemplate: PresenceTemplateDefinition = {
      ...template,
      sections: template.sections.map(section =>
        section.type === 'SERVICES' ? { ...section, isVisible: false } : section
      ),
    }

    expect(validatePresenceTemplate(invalidTemplate)).toContain(
      'Required section type SERVICES must be visible.'
    )
    expect(validatePresenceTemplate(invalidTemplate)).toContain(
      'Templates with protected booking entry must include a visible SERVICES section.'
    )
  })
})
