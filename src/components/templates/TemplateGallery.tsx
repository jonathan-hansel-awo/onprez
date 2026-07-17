'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  presenceTemplateCatalogue,
  templateCategories,
  type TemplateCategory,
} from '@/data/presence-template-catalogue'

const categoryLabels: Record<TemplateCategory, string> = {
  ALL: 'All templates',
  WELLNESS: 'Wellness',
  BEAUTY: 'Beauty',
  FITNESS: 'Fitness',
  PROFESSIONAL: 'Professional',
  CREATIVE: 'Creative',
  EDUCATION: 'Education',
}

export function TemplateGallery() {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('ALL')

  const filteredTemplates = useMemo(
    () =>
      selectedCategory === 'ALL'
        ? presenceTemplateCatalogue
        : presenceTemplateCatalogue.filter(template => template.category === selectedCategory),
    [selectedCategory]
  )

  return (
    <>
      <div className="mb-10 flex gap-2 overflow-x-auto pb-2" aria-label="Template categories">
        {templateCategories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            aria-pressed={selectedCategory === category}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              selectedCategory === category
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {filteredTemplates.map(template => (
          <article
            key={template.slug}
            className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm transition-transform hover:-translate-y-1"
          >
            <div
              className="relative aspect-[4/5] overflow-hidden p-5"
              style={{ backgroundColor: template.palette.surface }}
            >
              <div
                className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-2xl"
                style={{ backgroundColor: template.palette.primary }}
              />
              <div
                className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/50 p-6 shadow-xl"
                style={{ backgroundColor: template.palette.background, color: template.palette.text }}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                    Demo template
                  </p>
                  <p className="mt-5 text-sm font-medium opacity-70">
                    {template.preview.businessName}
                  </p>
                  <h2 className="mt-5 text-4xl font-semibold leading-tight">
                    {template.preview.headline}
                  </h2>
                </div>
                <div>
                  <div className="grid gap-3">
                    {template.preview.services.slice(0, 2).map(service => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm backdrop-blur"
                      >
                        <span className="font-medium">{service.name}</span>
                        <span className="font-semibold">{service.price}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-4 rounded-full px-5 py-3 text-center text-sm font-semibold text-white"
                    style={{ backgroundColor: template.palette.primary }}
                  >
                    Book a service
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    {categoryLabels[template.category]}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-gray-900">{template.name}</h3>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  Demo
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">{template.description}</p>
              <p className="mt-3 text-xs font-medium text-gray-500">Best for: {template.audience}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  href={`/templates/${template.slug}`}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Preview template
                </Link>
                <Link
                  href={`/signup?template=${template.slug}`}
                  className="rounded-xl bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Use this template
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
