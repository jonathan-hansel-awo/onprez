import Link from 'next/link'
import { presenceTemplateCatalogue } from '@/data/presence-template-catalogue'
import { realisticDemoBusiness, realisticDemoHref } from '@/data/realistic-demo-business'

export function ExamplesCarousel() {
  const featuredTemplates = presenceTemplateCatalogue.slice(0, 3)

  return (
    <section className="bg-gray-50 px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-onprez-blue">
            Fully designed templates
          </p>
          <h2 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Start with something worth sharing.
          </h2>
          <p className="mt-5 text-lg leading-8 text-gray-600">
            Browse distinctive presence pages for real service-business needs. Every business,
            service, price, and claim shown below is fictional demonstration content.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {featuredTemplates.map(template => (
            <article
              key={template.slug}
              className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] p-5" style={{ backgroundColor: template.palette.surface }}>
                <div
                  className="flex h-full flex-col justify-between rounded-[1.5rem] p-5 shadow-lg"
                  style={{
                    backgroundColor: template.palette.background,
                    color: template.palette.text,
                  }}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
                      Demo preview
                    </p>
                    <p className="mt-3 text-sm font-medium">{template.preview.businessName}</p>
                  </div>
                  <p className="text-2xl font-semibold leading-tight">{template.preview.headline}</p>
                  <div
                    className="rounded-full px-4 py-2 text-center text-xs font-semibold text-white"
                    style={{ backgroundColor: template.palette.primary }}
                  >
                    Book a service
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {template.slug === realisticDemoBusiness.templateSlug
                    ? 'Full realistic demo'
                    : template.category}
                </p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{template.name}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{template.description}</p>
                <Link
                  href={
                    template.slug === realisticDemoBusiness.templateSlug
                      ? realisticDemoHref
                      : `/templates/${template.slug}`
                  }
                  className="mt-5 inline-flex font-semibold text-onprez-blue"
                >
                  {template.slug === realisticDemoBusiness.templateSlug
                    ? 'Explore full demo'
                    : 'Preview template'}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/templates"
            className="inline-flex rounded-full bg-gradient-to-r from-onprez-blue to-onprez-purple px-8 py-3 font-semibold text-white shadow-lg"
          >
            Browse all templates
          </Link>
        </div>
      </div>
    </section>
  )
}
