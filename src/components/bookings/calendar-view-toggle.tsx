'use client'

import { Calendar, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type CalendarView = 'day' | 'week'

interface CalendarViewToggleProps {
  view: CalendarView
  onChange: (view: CalendarView) => void
}

export function CalendarViewToggle({ view, onChange }: CalendarViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      <button
        onClick={() => onChange('day')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          view === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
        )}
      >
        <Calendar className="w-4 h-4" />
        Day
      </button>
      <button
        onClick={() => onChange('week')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
        )}
      >
        <CalendarDays className="w-4 h-4" />
        Week
      </button>
    </div>
  )
}
