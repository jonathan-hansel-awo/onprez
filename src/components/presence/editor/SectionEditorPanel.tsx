'use client'

import { PageSection } from '@/types/page-sections'
import { X } from 'lucide-react'
import { HeroSectionEditor } from './sections/HeroSectionEditor'
import { AboutSectionEditor } from './sections/AboutSectionEditor'
import { ServicesSectionEditor } from './sections/ServicesSectionEditor'
import { GallerySectionEditor } from './sections/GallerySectionEditor'
import { ContactSectionEditor } from './sections/ContactSectionEditor'
import { FAQSectionEditor } from './sections/FAQSectionEditor'
import { NavbarSectionEditor } from './sections/NavbarSectionEditor'

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
        return <NavbarSectionEditor section={section} onUpdate={onUpdate} />

      case 'HERO':
        return <HeroSectionEditor section={section} onUpdate={onUpdate} />

      case 'ABOUT':
        return <AboutSectionEditor section={section} onUpdate={onUpdate} />

      case 'SERVICES':
        return (
          <ServicesSectionEditor section={section} onUpdate={onUpdate} businessId={businessId} />
        )

      case 'GALLERY':
        return <GallerySectionEditor section={section} onUpdate={onUpdate} />

      case 'CONTACT':
        return (
          <ContactSectionEditor section={section} onUpdate={onUpdate} businessId={businessId} />
        )

      case 'FAQ':
        return <FAQSectionEditor section={section} onUpdate={onUpdate} />

      // Rest remain the same
      case 'TESTIMONIALS':
      case 'CUSTOM_HTML':
        return (
          <div className="p-6 text-center text-gray-500">
            <p>Editor for {section.type} coming soon...</p>
            <p className="text-sm mt-2">This section will be available in the next milestone</p>
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
    <div className="bg-gray-50 max-h-[50vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <h3 className="font-semibold text-gray-900">
          Edit {section.type.charAt(0) + section.type.slice(1).toLowerCase().replace('_', ' ')}
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="p-4">{renderEditor()}</div>
    </div>
  )
}
