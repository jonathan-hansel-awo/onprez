'use client'

import { Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type CalendarView = 'month' | 'week' | 'day'

interface CalendarViewToggleProps {
  view: CalendarView
  onChange: (view: CalendarView) => void
}

export function CalendarViewToggle({ view, onChange }: CalendarViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      <button
        type="button"
        onClick={() => onChange('month')}
        className={cn(
          'flex min-h-10 items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          view === 'month'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        <CalendarRange className="w-4 h-4" />
        <span className="hidden sm:inline">Month</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('day')}
        className={cn(
          'flex min-h-10 items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          view === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
        )}
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">Day</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('week')}
        className={cn(
          'flex min-h-10 items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
        )}
      >
        <CalendarDays className="w-4 h-4" />
        <span className="hidden sm:inline">Week</span>
      </button>
    </div>
  )
}
