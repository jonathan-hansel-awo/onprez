'use client'

import { PageSection } from '@/types/page-sections'
import { SectionRenderer } from '../sections/SectionRenderer'

interface PresencePreviewProps {
  sections: PageSection[]
  previewMode: 'desktop' | 'mobile'
  businessId: string | null
}

export function PresencePreview({ sections, previewMode, businessId }: PresencePreviewProps) {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-xl mx-auto overflow-hidden
        ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-7xl'}
      `}
      style={{
        minHeight: previewMode === 'mobile' ? '667px' : '800px',
      }}
    >
      {businessId && (
        <SectionRenderer
          sections={sections}
          businessHandle="preview"
          businessData={{
            phone: '+44 20 1234 5678',
            email: 'hello@business.com',
            address: '123 Business St, London',
          }}
        />
      )}

      {sections.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No sections yet</p>
            <p className="text-sm mt-2">Add sections to see your presence page</p>
          </div>
        </div>
      )}
    </div>
  )
}
