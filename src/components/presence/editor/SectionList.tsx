'use client'

import {
  PageSection,
  createSection,
  type PresenceSectionType,
} from '@/types/page-sections'
import { Button } from '@/components/ui/button'
import { SectionEditorPanel } from './SectionEditorPanel'
import {
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  Navigation,
  Image as ImageIcon,
  Type,
  Package,
  Mail,
  HelpCircle,
  Star,
  Code,
  ChevronUp,
  ChevronDown,
  UserRound,
  ListChecks,
} from 'lucide-react'
import { useState } from 'react'

interface SectionListProps {
  sections: PageSection[]
  selectedSectionId: string | null
  onSectionSelect: (id: string | null) => void
  onSectionUpdate: (section: PageSection) => void
  onSectionDelete: (id: string) => void
  onSectionReorder: (sections: PageSection[]) => void
  onSectionAdd: (section: PageSection) => void
  businessId: string | null
}

const SECTION_ICONS = {
  NAVBAR: Navigation,
  HERO: Type,
  ABOUT: Type,
  OWNER: UserRound,
  SERVICES: Package,
  PROCESS: ListChecks,
  GALLERY: ImageIcon,
  CONTACT: Mail,
  FAQ: HelpCircle,
  TESTIMONIALS: Star,
  CUSTOM_HTML: Code,
} satisfies Record<PresenceSectionType, typeof Navigation>

const SECTION_LABELS: Record<PresenceSectionType, string> = {
  NAVBAR: 'Navigation',
  HERO: 'Hero',
  ABOUT: 'About the practice',
  OWNER: 'Meet the owner',
  SERVICES: 'Services',
  PROCESS: 'How it works',
  GALLERY: 'Gallery',
  CONTACT: 'Contact',
  FAQ: 'FAQ',
  TESTIMONIALS: 'Testimonials',
  CUSTOM_HTML: 'Custom HTML',
}

export function SectionList({
  sections,
  selectedSectionId,
  onSectionSelect,
  onSectionUpdate,
  onSectionDelete,
  onSectionReorder,
  onSectionAdd,
  businessId,
}: SectionListProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === index) return

    const newSections = [...sections]
    const draggedSection = newSections[draggedIndex]

    newSections.splice(draggedIndex, 1)
    newSections.splice(index, 0, draggedSection)

    const reorderedSections = newSections.map((section, idx) => ({
      ...section,
      order: idx,
    }))

    onSectionReorder(reorderedSections)
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
  }

  function handleAddSection(type: PresenceSectionType) {
    const newSection = createSection(type, sections.length)
    onSectionAdd(newSection)
    setShowAddMenu(false)
  }

  function toggleVisibility(section: PageSection) {
    onSectionUpdate({ ...section, isVisible: !section.isVisible })
  }

  function moveSection(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return

    const reordered = [...sections]
    const [movedSection] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, movedSection)
    onSectionReorder(reordered.map((section, order) => ({ ...section, order })))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Sections</h3>
            <p className="mt-1 text-xs text-gray-500">Build the page around the story you need.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="min-h-11"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>

        {showAddMenu && (
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <p className="mb-2 text-xs font-medium text-gray-600">Choose a section type:</p>
            {Object.entries(SECTION_ICONS).map(([type, Icon]) => (
              <button
                key={type}
                onClick={() => handleAddSection(type as PresenceSectionType)}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white"
              >
                <Icon className="h-4 w-4" />
                <span>{SECTION_LABELS[type as PresenceSectionType]}</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {sections.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No sections yet. Add your first section above.
            </div>
          ) : (
            sections.map((section, index) => {
              const Icon = SECTION_ICONS[section.type]
              const isSelected = selectedSectionId === section.id

              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSectionSelect(section.id)}
                  className={`
                    group relative cursor-pointer rounded-lg p-3 transition-all
                    ${isSelected ? 'border-2 border-onprez-blue bg-onprez-blue/10' : 'border border-gray-200 bg-white hover:border-gray-300'}
                    ${!section.isVisible ? 'opacity-50' : ''}
                  `}
                >
                  <div className="absolute left-1 top-1/2 hidden -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 md:block">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>

                  <div className="flex items-center gap-2 pl-0 md:gap-3 md:pl-4">
                    <Icon className="h-5 w-5 flex-shrink-0 text-gray-600" />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {SECTION_LABELS[section.type]}
                      </div>
                      <div className="text-xs text-gray-500">Order: {section.order + 1}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          moveSection(index, -1)
                        }}
                        disabled={index === 0}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded transition-colors hover:bg-gray-100 disabled:opacity-30 md:hidden"
                        aria-label={`Move ${SECTION_LABELS[section.type]} section up`}
                      >
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          moveSection(index, 1)
                        }}
                        disabled={index === sections.length - 1}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded transition-colors hover:bg-gray-100 disabled:opacity-30 md:hidden"
                        aria-label={`Move ${SECTION_LABELS[section.type]} section down`}
                      >
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          toggleVisibility(section)
                        }}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded transition-colors hover:bg-gray-100"
                        aria-label={`${section.isVisible ? 'Hide' : 'Show'} ${SECTION_LABELS[section.type]} section`}
                      >
                        {section.isVisible ? (
                          <Eye className="h-4 w-4 text-gray-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </button>

                      <button
                        onClick={e => {
                          e.stopPropagation()
                          if (confirm('Delete this section?')) {
                            onSectionDelete(section.id)
                          }
                        }}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded transition-colors hover:bg-red-50"
                        aria-label={`Delete ${SECTION_LABELS[section.type]} section`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {selectedSectionId && (
        <div className="border-t border-gray-200">
          <SectionEditorPanel
            section={sections.find(section => section.id === selectedSectionId)!}
            onUpdate={onSectionUpdate}
            onClose={() => onSectionSelect(null)}
            businessId={businessId}
          />
        </div>
      )}
    </div>
  )
}
