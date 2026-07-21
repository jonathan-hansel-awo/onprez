import { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/prisma'
import { createSignupPresencePageContent } from '../src/lib/templates/apply-signup-template'

const BUSINESS_HANDLE = 'heavenlypamperpalace'
const TEMPLATE_SLUG = 'heavenly-pamper-palace'

async function main() {
  const shouldApply = process.argv.includes('--apply')
  const isDryRun = process.argv.includes('--dry-run') || !shouldApply

  const business = await prisma.business.findUnique({
    where: {
      slug: BUSINESS_HANDLE,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      settings: true,
      isPublished: true,
      pages: {
        where: {
          slug: 'home',
        },
        select: {
          id: true,
          slug: true,
          content: true,
          publishedContent: true,
          isPublished: true,
          version: true,
        },
      },
    },
  })

  if (!business) {
    throw new Error(`Business with handle "${BUSINESS_HANDLE}" was not found.`)
  }

  if (business.pages.length !== 1) {
    throw new Error(
      `Expected exactly one home page for "${BUSINESS_HANDLE}", but found ${business.pages.length}.`
    )
  }

  const homePage = business.pages[0]

  const appliedTemplate = createSignupPresencePageContent(
    business.name,
    business.category,
    TEMPLATE_SLUG
  )

  if (!appliedTemplate.templateSlug || !appliedTemplate.theme) {
    throw new Error(`Template "${TEMPLATE_SLUG}" could not be generated.`)
  }

  const existingSettings =
    business.settings && typeof business.settings === 'object' && !Array.isArray(business.settings)
      ? (business.settings as Prisma.JsonObject)
      : {}

  console.log('Presence template reapplication')
  console.log('--------------------------------')
  console.log(`Business: ${business.name}`)
  console.log(`Handle: ${business.slug}`)
  console.log(`Business published: ${business.isPublished}`)
  console.log(`Home page published: ${homePage.isPublished}`)
  console.log(`Current page version: ${homePage.version}`)
  console.log(`Target template: ${appliedTemplate.templateName}`)
  console.log(`Sections to apply: ${appliedTemplate.sections.length}`)
  console.log('Published content will be preserved: yes')
  console.log('Services and bookings will be affected: no')

  if (isDryRun) {
    console.log('\nDry run only. No database records were changed.')
    console.log('Run again with --apply to perform the update.')
    return
  }

  await prisma.$transaction([
    prisma.page.update({
      where: {
        id: homePage.id,
      },
      data: {
        content: appliedTemplate.sections as unknown as Prisma.InputJsonValue,

        // Deliberately do not replace publishedContent.
        // Louise can review the restored template as a draft before publishing.
        version: {
          increment: 1,
        },
      },
    }),

    prisma.business.update({
      where: {
        id: business.id,
      },
      data: {
        settings: {
          ...existingSettings,
          presenceTemplateSlug: appliedTemplate.templateSlug,
          theme: appliedTemplate.theme,
        } as Prisma.InputJsonValue,
      },
    }),
  ])

  console.log('\nHeavenly Pamper Palace was reapplied successfully.')
  console.log('The existing published page was not overwritten.')
  console.log('Louise can now review the restored draft in the presence editor.')
}

main()
  .catch(error => {
    console.error('\nTemplate reapplication failed.')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
