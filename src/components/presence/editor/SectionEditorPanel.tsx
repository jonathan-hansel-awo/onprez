'use client'

import { PageSection } from '@/types/page-sections'
import { X } from 'lucide-react'
import { HeroSectionEditor } from './sections/HeroSectionEditor'
import { AboutSectionEditor } from './sections/AboutSectionEditor'
import { OwnerSectionEditor } from './sections/OwnerSectionEditor'
import { ServicesSectionEditor } from './sections/ServicesSectionEditor'
import { ProcessSectionEditor } from './sections/ProcessSectionEditor'
import { GallerySectionEditor } from './sections/GallerySectionEditor'
import { ContactSectionEditor } from './sections/ContactSectionEditor'
import { FAQSectionEditor } from './sections/FAQSectionEditor'
import { NavbarSectionEditor } from './sections/NavbarSectionEditor'
import { TestimonialsSectionEditor } from './sections/TestimonialsSectionEditor'

interface SectionEditorPanelProps {
  section: PageSection
  onUpdate: (section: PageSection) => void
  onClose: () => void
  businessId: string | null
}

export function SectionEditorPanel({
  section,
  onUpdate,
  onClose,
  businessId,
}: SectionEditorPanelProps) {
  function renderEditor() {
    switch (section.type) {
      case 'NAVBAR':
        return <NavbarSectionEditor section={section} onUpdate={onUpdate} businessId={businessId} />
      case 'HERO':
        return <HeroSectionEditor section={section} onUpdate={onUpdate} businessId={businessId} />
      case 'ABOUT':
        return <AboutSectionEditor section={section} onUpdate={onUpdate} businessId={businessId} />
      case 'OWNER':
        return <OwnerSectionEditor section={section} onUpdate={onUpdate} businessId={businessId} />
      case 'SERVICES':
        return (
          <ServicesSectionEditor section={section} onUpdate={onUpdate} businessId={businessId} />
        )
      case 'PROCESS':
        return <ProcessSectionEditor section={section} onUpdate={onUpdate} />
      case 'GALLERY':
        return (
          <GallerySectionEditor section={section} onUpdate={onUpdate} businessId={businessId} />
        )
      case 'CONTACT':
        return (
          <ContactSectionEditor section={section} onUpdate={onUpdate} businessId={businessId} />
        )
      case 'FAQ':
        return <FAQSectionEditor section={section} onUpdate={onUpdate} />
      case 'TESTIMONIALS':
        return (
          <TestimonialsSectionEditor
            section={section}
            onUpdate={onUpdate}
            businessId={businessId}
          />
        )
      case 'CUSTOM_HTML':
        return (
          <div className="p-6 text-center text-gray-500">
            <p>Custom HTML remains unavailable for safety.</p>
            <p className="mt-2 text-sm">
              Use the premium layout controls instead; they remain responsive and accessible.
            </p>
          </div>
        )
      default:
        return (
          <div className="p-6 text-center text-gray-500">
            <p>Unknown section type</p>
          </div>
        )
    }
  }

  return (
    <div className="max-h-[62vh] overflow-y-auto bg-gray-50">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h3 className="font-semibold text-gray-900">
          Edit {section.type.charAt(0) + section.type.slice(1).toLowerCase().replace('_', ' ')}
        </h3>
        <button
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded transition-colors hover:bg-gray-100"
          aria-label="Close section editor"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="p-4">{renderEditor()}</div>
    </div>
  )
}
