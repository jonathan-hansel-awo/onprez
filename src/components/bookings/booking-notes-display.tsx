'use client'

import { useState } from 'react'
import { FileText, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingNotesEditor } from './booking-notes-editor'
import { cn } from '@/lib/utils/cn'

interface BookingNotesDisplayProps {
  bookingId: string
  businessNotes: string | null
  customerNotes: string | null
  onUpdate?: (notes: { businessNotes: string | null; customerNotes: string | null }) => void
  editable?: boolean
}

export function BookingNotesDisplay({
  bookingId,
  businessNotes,
  customerNotes,
  onUpdate,
  editable = true,
}: BookingNotesDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState({ businessNotes, customerNotes })

  const hasNotes = notes.businessNotes || notes.customerNotes
  const previewLength = 150

  const handleSave = (updatedNotes: {
    businessNotes: string | null
    customerNotes: string | null
  }) => {
    setNotes(updatedNotes)
    setIsEditing(false)
    onUpdate?.(updatedNotes)
  }

  if (isEditing) {
    return (
      <BookingNotesEditor
        bookingId={bookingId}
        businessNotes={notes.businessNotes}
        customerNotes={notes.customerNotes}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Notes</span>
        </div>
        {editable && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-1" />
            {hasNotes ? 'Edit' : 'Add Notes'}
          </Button>
        )}
      </div>

      {/* Notes Content */}
      {hasNotes ? (
        <div className="space-y-3">
          {/* Customer Notes */}
          {notes.customerNotes && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-1">Customer Notes</p>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">
                {isExpanded || notes.customerNotes.length <= previewLength
                  ? notes.customerNotes
                  : `${notes.customerNotes.slice(0, previewLength)}...`}
              </p>
            </div>
          )}

          {/* Business Notes */}
          {notes.businessNotes && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-xs font-medium text-amber-700 mb-1">Internal Notes</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">
                {isExpanded || notes.businessNotes.length <= previewLength
                  ? notes.businessNotes
                  : `${notes.businessNotes.slice(0, previewLength)}...`}
              </p>
            </div>
          )}

          {/* Expand/Collapse */}
          {((notes.customerNotes && notes.customerNotes.length > previewLength) ||
            (notes.businessNotes && notes.businessNotes.length > previewLength)) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No notes added</p>
      )}
    </div>
  )
}
