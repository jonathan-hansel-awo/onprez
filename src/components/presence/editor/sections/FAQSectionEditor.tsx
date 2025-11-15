/* eslint-disable react/no-unescaped-entities */
'use client'

import { FAQSection } from '@/types/page-sections'
import { Input } from '@/components/form/input'
import { TextArea } from '@/components/form/text-area'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Plus, X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'

interface FAQSectionEditorProps {
  section: FAQSection
  onUpdate: (section: FAQSection) => void
}

export function FAQSectionEditor({ section, onUpdate }: FAQSectionEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function updateData<K extends keyof FAQSection['data']>(field: K, value: FAQSection['data'][K]) {
    onUpdate({
      ...section,
      data: {
        ...section.data,
        [field]: value,
      },
    })
  }

  function addFAQ() {
    const newFAQ = {
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question: '',
      answer: '',
    }

    updateData('items', [...section.data.items, newFAQ])
    setExpandedIndex(section.data.items.length) // Expand the new FAQ
  }

  function removeFAQ(index: number) {
    const newItems = section.data.items.filter((_, i) => i !== index)
    updateData('items', newItems)
    if (expandedIndex === index) {
      setExpandedIndex(null)
    }
  }

  function updateFAQ(index: number, field: 'question' | 'answer', value: string) {
    const newItems = section.data.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    updateData('items', newItems)
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === index) return

    const newItems = [...section.data.items]
    const draggedItem = newItems[draggedIndex]

    newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, draggedItem)

    updateData('items', newItems)
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">FAQ Settings</h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="faq-title">Section Title *</Label>
            <Input
              id="faq-title"
              value={section.data.title}
              onChange={e => updateData('title', e.target.value)}
              placeholder="e.g., Frequently Asked Questions, Common Questions"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* FAQ Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Questions & Answers</h3>
          <Button variant="primary" size="sm" onClick={addFAQ}>
            <Plus className="w-4 h-4 mr-1" />
            Add FAQ
          </Button>
        </div>

        {section.data.items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">No FAQs yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Add frequently asked questions to help your customers
            </p>
            <Button variant="primary" size="sm" onClick={addFAQ}>
              <Plus className="w-4 h-4 mr-1" />
              Add Your First FAQ
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 mb-3">💡 Drag FAQs to reorder them</p>

            {section.data.items.map((item, index) => {
              const isExpanded = expandedIndex === index

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    group bg-gray-50 rounded-lg overflow-hidden transition-all
                    ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
                    ${isExpanded ? 'ring-2 ring-onprez-blue' : 'border border-gray-200'}
                  `}
                >
                  {/* FAQ Header */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {/* Drag Handle */}
                    <div className="cursor-move">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Question Preview */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.question || `Question ${index + 1} (empty)`}
                      </p>
                      {item.answer && !isExpanded && (
                        <p className="text-sm text-gray-500 truncate mt-1">{item.answer}</p>
                      )}
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          if (confirm('Delete this FAQ?')) {
                            removeFAQ(index)
                          }
                        }}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-5 h-5 text-red-600" />
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {/* FAQ Editor (Expanded) */}
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-4 border-t border-gray-200">
                      {/* Question */}
                      <div>
                        <Label htmlFor={`faq-question-${index}`}>Question *</Label>
                        <Input
                          id={`faq-question-${index}`}
                          value={item.question}
                          onChange={e => updateFAQ(index, 'question', e.target.value)}
                          placeholder="Enter the question"
                          className="mt-1"
                        />
                      </div>

                      {/* Answer */}
                      <div>
                        <Label htmlFor={`faq-answer-${index}`}>Answer *</Label>
                        <TextArea
                          id={`faq-answer-${index}`}
                          value={item.answer}
                          onChange={e => updateFAQ(index, 'answer', e.target.value)}
                          placeholder="Enter the answer"
                          rows={4}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setExpandedIndex(null)}>
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Info Boxes */}
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Good FAQs address common customer concerns and reduce support
            inquiries
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            ✨ <strong>SEO Benefit:</strong> FAQs help your page rank better in search engines and
            can appear in Google's rich snippets
          </p>
        </div>
      </div>
    </div>
  )
}
