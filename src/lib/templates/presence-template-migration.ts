import type { BusinessCategory } from '@prisma/client'
import type { PageSection, SectionType } from '@/types/page-sections'
import {
  createCanonicalPresencePageContent,
  type CanonicalPresencePage,
} from './canonical-template-engine'

export type PresenceTemplateMigrationMode = 'repair' | 'overhaul'

export interface CreatePresenceTemplateMigrationPlanOptions {
  businessName: string
  category: BusinessCategory
  templateSlug: string
  existingSections: PageSection[]
  migrationMode: PresenceTemplateMigrationMode
}

export interface PresenceTemplateMigrationSummary {
  migrationMode: PresenceTemplateMigrationMode
  sourceSectionCount: number
  targetSectionCount: number
  addedSectionTypes: SectionType[]
  removedSectionTypes: SectionType[]
  replacedSectionTypes: SectionType[]
  unchangedSectionTypes: SectionType[]
  templateDemoContentIncluded: boolean
  preservedDataSources: string[]
}

export interface PresenceTemplateMigrationPlan {
  page: CanonicalPresencePage
  summary: PresenceTemplateMigrationSummary
}

function uniqueSectionTypes(sections: PageSection[]) {
  return Array.from(new Set(sections.map(section => section.type)))
}

function sectionMap(sections: PageSection[]) {
  return new Map(sections.map(section => [section.type, section]))
}

function toAccountPage(page: CanonicalPresencePage): CanonicalPresencePage {
  return {
    templateSlug: page.templateSlug,
    templateName: page.templateName,
    templateVersion: page.templateVersion,
    sections: page.sections,
    theme: page.theme,
  }
}

/**
 * Builds the database payload and a human-readable change summary for a presence migration.
 *
 * Repair mode keeps meaningful page-owned content while adopting canonical presentation.
 * Overhaul mode deliberately builds from the exact public template preview composition, then
 * strips preview-only service and business records so the live page continues to use the
 * business's database-backed services, contact details, availability, bookings, and settings.
 */
export function createPresenceTemplateMigrationPlan({
  businessName,
  category,
  templateSlug,
  existingSections,
  migrationMode,
}: CreatePresenceTemplateMigrationPlanOptions): PresenceTemplateMigrationPlan {
  const generated = createCanonicalPresencePageContent(businessName, category, templateSlug, {
    mode: migrationMode === 'overhaul' ? 'preview' : 'account',
    existingSections: migrationMode === 'repair' ? existingSections : undefined,
    preserveContent: migrationMode === 'repair',
  })
  const page = toAccountPage(generated)
  const sourceByType = sectionMap(existingSections)
  const targetByType = sectionMap(page.sections)
  const sourceTypes = uniqueSectionTypes(existingSections)
  const targetTypes = uniqueSectionTypes(page.sections)

  const addedSectionTypes = targetTypes.filter(type => !sourceByType.has(type))
  const removedSectionTypes = sourceTypes.filter(type => !targetByType.has(type))
  const replacedSectionTypes = targetTypes.filter(type => {
    const source = sourceByType.get(type)
    const target = targetByType.get(type)
    return Boolean(source && target && JSON.stringify(source) !== JSON.stringify(target))
  })
  const unchangedSectionTypes = targetTypes.filter(type => {
    const source = sourceByType.get(type)
    const target = targetByType.get(type)
    return Boolean(source && target && JSON.stringify(source) === JSON.stringify(target))
  })

  return {
    page,
    summary: {
      migrationMode,
      sourceSectionCount: existingSections.length,
      targetSectionCount: page.sections.length,
      addedSectionTypes,
      removedSectionTypes,
      replacedSectionTypes,
      unchangedSectionTypes,
      templateDemoContentIncluded: migrationMode === 'overhaul',
      preservedDataSources: [
        'service records, categories, prices, durations, and service images',
        'booking, availability, customer, and appointment records',
        'business contact, address, social, SEO, and trust-signal fields rendered outside page JSON',
        'non-template business settings and the current draft/published status',
      ],
    },
  }
}
