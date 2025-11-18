/* eslint-disable react/no-unescaped-entities */
'use client'

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface SEOChecklistProps {
  checks: {
    metaTitle: boolean
    metaDescription: boolean
    hasImages: boolean
    imagesHaveAlt: boolean
    hasFAQs: boolean
    hasTestimonials: boolean
    hasServices: boolean
  }
}

export function SEOChecklist({ checks }: SEOChecklistProps) {
  const items = [
    { label: 'Meta title set', status: checks.metaTitle },
    { label: 'Meta description set', status: checks.metaDescription },
    { label: 'Images added', status: checks.hasImages },
    { label: 'All images have alt text', status: checks.imagesHaveAlt },
    { label: 'FAQs added (boosts SEO)', status: checks.hasFAQs },
    { label: 'Testimonials added', status: checks.hasTestimonials },
    { label: 'Services listed', status: checks.hasServices },
  ]

  const score = items.filter(item => item.status).length
  const total = items.length
  const percentage = Math.round((score / total) * 100)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">SEO Health</h3>
        <div className="text-2xl font-bold text-onprez-blue">{percentage}%</div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {item.status ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <span className={`text-sm ${item.status ? 'text-gray-900' : 'text-gray-500'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {percentage < 100 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Complete all items to maximize your page's visibility in search engines!
          </p>
        </div>
      )}
    </Card>
  )
}
