import { prisma } from '@/lib/prisma'
import { PageSection, FAQSection } from '@/types/page-sections'

/**
 * Syncs FAQ items from page content to the FAQ table
 * This keeps the presence page FAQs in sync with the FAQ management system
 */
export async function syncFAQsFromPage(businessId: string, sections: PageSection[]) {
  try {
    // Find FAQ section in the page content
    const faqSection = sections.find(s => s.type === 'FAQ') as FAQSection | undefined

    if (!faqSection || !faqSection.data.items || faqSection.data.items.length === 0) {
      // If no FAQ section or no items, delete all FAQs
      await prisma.fAQ.deleteMany({
        where: { businessId },
      })
      return { success: true, count: 0 }
    }

    // Delete existing FAQs
    await prisma.fAQ.deleteMany({
      where: { businessId },
    })

    // Create new FAQs from section items
    const result = await prisma.fAQ.createMany({
      data: faqSection.data.items.map((item, index) => ({
        businessId,
        question: item.question,
        answer: item.answer,
        order: index,
        isActive: true,
      })),
    })

    return { success: true, count: result.count }
  } catch (error) {
    console.error('Sync FAQs error:', error)
    return { success: false, error: 'Failed to sync FAQs' }
  }
}
