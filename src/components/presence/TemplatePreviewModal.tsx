'use client'

import { PresenceTemplate } from '@/types/templates'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface TemplatePreviewModalProps {
  template: PresenceTemplate | null
  isOpen: boolean
  onClose: () => void
  onSelect: (template: PresenceTemplate) => void
}

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onSelect,
}: TemplatePreviewModalProps) {
  if (!template) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-4 md:inset-10 bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
                <p className="text-gray-600 mt-1">{template.description}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-6xl mx-auto">
                {/* Template Thumbnail Large */}
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 mb-6">
                  {template.thumbnail ? (
                    <Image
                      src={template.thumbnail}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span>Template Preview</span>
                    </div>
                  )}
                </div>

                {/* Template Details */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Sections Included</h3>
                    <ul className="space-y-2">
                      {template.content.sections.map(section => (
                        <li key={section.id} className="flex items-center gap-2 text-gray-700">
                          <div className="w-2 h-2 rounded-full bg-onprez-blue" />
                          <span className="capitalize">{section.type.toLowerCase()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Theme Colors</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border border-gray-200"
                          style={{ backgroundColor: template.content.theme?.primaryColor }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Primary Color</p>
                          <p className="text-xs text-gray-600">
                            {template.content.theme?.primaryColor}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border border-gray-200"
                          style={{ backgroundColor: template.content.theme?.secondaryColor }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Secondary Color</p>
                          <p className="text-xs text-gray-600">
                            {template.content.theme?.secondaryColor}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onSelect(template)
                  onClose()
                }}
              >
                Use This Template
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
