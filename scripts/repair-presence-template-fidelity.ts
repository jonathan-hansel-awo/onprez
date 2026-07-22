import { Prisma, PrismaClient } from '@prisma/client'
import {
  CANONICAL_TEMPLATE_VERSION,
  createCanonicalPresencePageContent,
  isCanonicalTemplateSlug,
} from '../src/lib/templates/canonical-template-engine'
import type { PageSection } from '../src/types/page-sections'

const prisma = new PrismaClient()

const defaultRepairs: Record<string, string> = {
  heavenlypamperpalace: 'heavenly-pamper-palace',
  hanselisky: 'editorial-beauty',
}

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

function readSections(value: Prisma.JsonValue | null | undefined): PageSection[] {
  return Array.isArray(value) ? (value as unknown as PageSection[]) : []
}

async function repairBusiness(
  businessSelector: string,
  templateSlug: string,
  publish: boolean,
  dryRun: boolean
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

  const sourceSections = readSections(page.content).length
    ? readSections(page.content)
    : readSections(page.publishedContent)
  const applied = createCanonicalPresencePageContent(
    business.name,
    business.category,
    templateSlug,
    {
      mode: 'account',
      existingSections: sourceSections,
      preserveContent: true,
    }
  )

  if (!applied.templateSlug || !applied.theme) {
    throw new Error(`Could not build canonical template ${templateSlug}`)
  }

  const currentSettings =
    business.settings && typeof business.settings === 'object' && !Array.isArray(business.settings)
      ? (business.settings as Prisma.JsonObject)
      : {}

  const result = {
    business: { id: business.id, name: business.name, slug: business.slug },
    template: applied.templateSlug,
    templateVersion: CANONICAL_TEMPLATE_VERSION,
    sectionCount: applied.sections.length,
    wasPublished: page.isPublished,
    publish,
    dryRun,
  }

  if (!dryRun) {
    const now = new Date()
    await prisma.$transaction([
      prisma.page.update({
        where: { id: page.id },
        data: {
          content: applied.sections as unknown as Prisma.InputJsonValue,
          ...(publish && page.isPublished
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
  const publish = readBoolean('publish', false)
  const dryRun = readBoolean('dry-run', false)

  if (business) {
    const templateSlug = requestedTemplate || defaultRepairs[business]
    if (!templateSlug) {
      throw new Error('Pass --template=<canonical-template-slug> for a custom business selector')
    }
    await repairBusiness(business, templateSlug, publish, dryRun)
    return
  }

  if (requestedTemplate) {
    throw new Error('--template requires --business')
  }

  for (const [businessSlug, templateSlug] of Object.entries(defaultRepairs)) {
    await repairBusiness(businessSlug, templateSlug, publish, dryRun)
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
