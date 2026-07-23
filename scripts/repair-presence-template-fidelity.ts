import { Prisma, PrismaClient } from '@prisma/client'
import {
  CANONICAL_TEMPLATE_VERSION,
  isCanonicalTemplateSlug,
} from '../src/lib/templates/canonical-template-engine'
import {
  createPresenceTemplateMigrationPlan,
  type PresenceTemplateMigrationMode,
} from '../src/lib/templates/presence-template-migration'
import type { PageSection } from '../src/types/page-sections'

const prisma = new PrismaClient()

const defaultTargets: Record<string, string> = {
  heavenlypamperpalace: 'heavenly-pamper-palace',
  hanselisky: 'editorial-beauty',
}

const approvedTemplateMirrorBusinesses = new Set(Object.keys(defaultTargets))

function readArgument(name: string) {
  const prefix = `--${name}=`
  return process.argv.find(argument => argument.startsWith(prefix))?.slice(prefix.length)
}

function readBoolean(name: string, fallback = false) {
  const value = readArgument(name)
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`--${name} must be true or false`)
}

function readMigrationMode(): PresenceTemplateMigrationMode {
  const value = readArgument('mode') || 'overhaul'
  if (value === 'repair' || value === 'overhaul') return value
  throw new Error('--mode must be repair or overhaul')
}

function readSections(value: Prisma.JsonValue | null | undefined): PageSection[] {
  return Array.isArray(value) ? (value as unknown as PageSection[]) : []
}

async function migrateBusiness(
  businessSelector: string,
  templateSlug: string,
  migrationMode: PresenceTemplateMigrationMode,
  publish: boolean,
  dryRun: boolean,
  allowTemplateDemoContent: boolean
) {
  if (!isCanonicalTemplateSlug(templateSlug)) {
    throw new Error(`Unknown canonical template: ${templateSlug}`)
  }

  const business = await prisma.business.findFirst({
    where: { OR: [{ id: businessSelector }, { slug: businessSelector }] },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      settings: true,
      pages: {
        where: { slug: 'home' },
        take: 1,
        select: {
          id: true,
          content: true,
          publishedContent: true,
          isPublished: true,
          version: true,
        },
      },
    },
  })

  if (!business) throw new Error(`No business found for ${businessSelector}`)

  const page = business.pages[0]
  if (!page) throw new Error(`No home presence page found for ${business.slug}`)

  if (
    migrationMode === 'overhaul' &&
    !approvedTemplateMirrorBusinesses.has(business.slug) &&
    !allowTemplateDemoContent
  ) {
    throw new Error(
      `Overhaul mode mirrors template-owned example copy, reviews, and FAQs. ` +
        `Pass --allow-template-demo-content=true to confirm this for ${business.slug}.`
    )
  }

  const draftSections = readSections(page.content)
  const publishedSections = readSections(page.publishedContent)
  const sourceSections = draftSections.length ? draftSections : publishedSections
  const source = draftSections.length ? 'draft content' : 'published content fallback'
  const plan = createPresenceTemplateMigrationPlan({
    businessName: business.name,
    category: business.category,
    templateSlug,
    existingSections: sourceSections,
    migrationMode,
  })
  const applied = plan.page

  if (!applied.templateSlug || !applied.theme) {
    throw new Error(`Could not build canonical template ${templateSlug}`)
  }

  const currentSettings =
    business.settings && typeof business.settings === 'object' && !Array.isArray(business.settings)
      ? (business.settings as Prisma.JsonObject)
      : {}
  const willUpdatePublishedContent = publish && page.isPublished
  const warnings: string[] = []

  if (publish && !page.isPublished) {
    warnings.push(
      'The page is currently a draft. --publish=true will not change its publication status or expose it publicly.'
    )
  }

  if (migrationMode === 'overhaul') {
    warnings.push(
      'Overhaul mode replaces all page-owned sections, layout, text, images, reviews, and FAQs with the canonical template mirror.'
    )
  }

  const result = {
    business: { id: business.id, name: business.name, slug: business.slug },
    template: applied.templateSlug,
    templateVersion: CANONICAL_TEMPLATE_VERSION,
    source,
    ...plan.summary,
    wasPublished: page.isPublished,
    willUpdateDraftContent: true,
    willUpdatePublishedContent,
    publishRequested: publish,
    dryRun,
    warnings,
  }

  if (!dryRun) {
    const now = new Date()
    await prisma.$transaction([
      prisma.page.update({
        where: { id: page.id },
        data: {
          content: applied.sections as unknown as Prisma.InputJsonValue,
          ...(willUpdatePublishedContent
            ? {
                publishedContent: applied.sections as unknown as Prisma.InputJsonValue,
                publishedAt: now,
                version: { increment: 1 },
              }
            : {}),
        },
      }),
      prisma.business.update({
        where: { id: business.id },
        data: {
          settings: {
            ...currentSettings,
            presenceTemplateSlug: applied.templateSlug,
            presenceTemplateVersion: CANONICAL_TEMPLATE_VERSION,
            presenceTemplateMigrationMode: migrationMode,
            presenceTemplateMigratedAt: now.toISOString(),
            theme: applied.theme,
          } as unknown as Prisma.InputJsonValue,
        },
      }),
    ])
  }

  console.log(JSON.stringify(result, null, 2))
}

async function main() {
  const business = readArgument('business')
  const requestedTemplate = readArgument('template')
  const migrationMode = readMigrationMode()
  const publish = readBoolean('publish', false)
  const dryRun = readBoolean('dry-run', false)
  const allowTemplateDemoContent = readBoolean('allow-template-demo-content', false)

  if (business) {
    const templateSlug = requestedTemplate || defaultTargets[business]
    if (!templateSlug) {
      throw new Error('Pass --template=<canonical-template-slug> for a custom business selector')
    }
    await migrateBusiness(
      business,
      templateSlug,
      migrationMode,
      publish,
      dryRun,
      allowTemplateDemoContent
    )
    return
  }

  if (requestedTemplate) {
    throw new Error('--template requires --business')
  }

  for (const [businessSlug, templateSlug] of Object.entries(defaultTargets)) {
    await migrateBusiness(
      businessSlug,
      templateSlug,
      migrationMode,
      publish,
      dryRun,
      allowTemplateDemoContent
    )
  }
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
