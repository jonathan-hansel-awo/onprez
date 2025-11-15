'use client'

import { useState } from 'react'
import { PresenceTemplate } from '@/types/templates'
import { PRESENCE_TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/templates/presence-templates'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface TemplateSelectorProps {
  selectedTemplateId?: string
  onSelect: (template: PresenceTemplate) => void
  onPreview?: (template: PresenceTemplate) => void
}

export function TemplateSelector({
  selectedTemplateId,
  onSelect,
  onPreview,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredTemplates = selectedCategory
    ? PRESENCE_TEMPLATES.filter(t => t.category === selectedCategory)
    : PRESENCE_TEMPLATES

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All Templates
        </Button>
        {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => {
          const isSelected = selectedTemplateId === template.id

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-onprez-blue' : ''
                }`}
                onClick={() => onSelect(template)}
              >
                {/* Template Thumbnail */}
                <div className="relative h-48 bg-gray-200">
                  {template.thumbnail ? (
                    <Image
                      src={template.thumbnail}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-sm">Preview</span>
                    </div>
                  )}

                  {/* Selected Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-onprez-blue/20 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-onprez-blue flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Preview Button */}
                  {onPreview && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onPreview(template)
                      }}
                      className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-gray-700" />
                    </button>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <Badge size="sm" variant="default">
                      {TEMPLATE_CATEGORIES[template.category]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>

                  {template.isDefault && (
                    <div className="mt-3">
                      <Badge size="sm" className="bg-green-100 text-green-800">
                        Recommended
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
