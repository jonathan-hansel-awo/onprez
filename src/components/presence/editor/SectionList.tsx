'use client'

import { PageSection, createSection, SectionType } from '@/types/page-sections'
import { Button } from '@/components/ui/button'
import {
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  Image as ImageIcon,
  Type,
  Package,
  Mail,
  HelpCircle,
  Star,
  Code,
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
}

const SECTION_ICONS = {
  HERO: Type,
  ABOUT: Type,
  SERVICES: Package,
  GALLERY: ImageIcon,
  CONTACT: Mail,
  FAQ: HelpCircle,
  TESTIMONIALS: Star,
  CUSTOM_HTML: Code,
}

export function SectionList({
  sections,
  selectedSectionId,
  onSectionSelect,
  onSectionUpdate,
  onSectionDelete,
  onSectionReorder,
  onSectionAdd,
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

    // Update order
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

  function handleAddSection(type: SectionType) {
    const newSection = createSection(type, sections.length)
    onSectionAdd(newSection)
    setShowAddMenu(false)
  }

  function toggleVisibility(section: PageSection) {
    onSectionUpdate({ ...section, isVisible: !section.isVisible })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Sections</h3>
        <Button variant="primary" size="sm" onClick={() => setShowAddMenu(!showAddMenu)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Add Section Menu */}
      {showAddMenu && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <p className="text-xs text-gray-600 font-medium mb-2">Choose a section type:</p>
          {Object.entries(SECTION_ICONS).map(([type, Icon]) => (
            <button
              key={type}
              onClick={() => handleAddSection(type as SectionType)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors"
            >
              <Icon className="w-4 h-4" />
              <span className="capitalize">{type.toLowerCase().replace('_', ' ')}</span>
            </button>
          ))}
        </div>
      )}

      {/* Section List */}
      <div className="space-y-2">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
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
                  group relative p-3 rounded-lg cursor-pointer transition-all
                  ${isSelected ? 'bg-onprez-blue/10 border-2 border-onprez-blue' : 'bg-white border border-gray-200 hover:border-gray-300'}
                  ${!section.isVisible ? 'opacity-50' : ''}
                `}
              >
                {/* Drag Handle */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </div>

                <div className="flex items-center gap-3 pl-4">
                  <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {section.type.charAt(0) +
                        section.type.slice(1).toLowerCase().replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">Order: {section.order + 1}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        toggleVisibility(section)
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {section.isVisible ? (
                        <Eye className="w-4 h-4 text-gray-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (confirm('Delete this section?')) {
                          onSectionDelete(section.id)
                        }
                      }}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
