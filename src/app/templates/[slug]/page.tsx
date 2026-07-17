import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TemplatePreviewPersonaliser } from '@/components/templates/TemplatePreviewPersonaliser'
import {
  getPresenceTemplate,
  presenceTemplateCatalogue,
} from '@/data/presence-template-catalogue'
import { normalisePreviewBusinessName } from '@/lib/templates/preview-personalisation'

interface TemplatePreviewPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ businessName?: string | string[] }>
}

export function generateStaticParams() {
  return presenceTemplateCatalogue.map(template => ({ slug: template.slug }))
}

export async function generateMetadata({ params }: TemplatePreviewPageProps): Promise<Metadata> {
  const { slug } = await params
  const template = getPresenceTemplate(slug)

  if (!template) {
    return { title: 'Template not found | OnPrez' }
  }

  return {
    title: `${template.name} Template Preview | OnPrez`,
    description: template.description,
    robots: { index: false, follow: true },
  }
}

export default async function TemplatePreviewPage({
  params,
  searchParams,
}: TemplatePreviewPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const template = getPresenceTemplate(slug)

  if (!template) {
    notFound()
  }

  const requestedBusinessName = Array.isArray(query.businessName)
    ? query.businessName[0]
    : query.businessName

  return (
    <TemplatePreviewPersonaliser
      template={template}
      initialBusinessName={normalisePreviewBusinessName(requestedBusinessName)}
    />
  )
}
