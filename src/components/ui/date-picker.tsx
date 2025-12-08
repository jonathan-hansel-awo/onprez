'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar } from './calendar'
import { Button } from './button'
import { CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  disabledDates?: string[]
  disabledDaysOfWeek?: number[]
  className?: string
  clearable?: boolean
}

function formatDateDisplay(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  error,
  disabled = false,
  minDate,
  maxDate,
  disabledDates,
  disabledDaysOfWeek,
  className,
  clearable = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleDateSelect(date: Date) {
    onChange(date)
    setIsOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left',
          'border-2 rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-onprez-blue/20',
          error
            ? 'border-red-500 focus:border-red-500'
            : isOpen
              ? 'border-onprez-blue ring-2 ring-onprez-blue/20'
              : 'border-gray-300 hover:border-gray-400 focus:border-onprez-blue',
          disabled && 'bg-gray-50 cursor-not-allowed opacity-60'
        )}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <span className={cn(value ? 'text-gray-900' : 'text-gray-400')}>
            {value ? formatDateDisplay(value) : placeholder}
          </span>
        </div>

        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </button>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white border-2 border-gray-200 rounded-xl shadow-lg">
          <Calendar
            selectedDate={value}
            onDateSelect={handleDateSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
            disabledDaysOfWeek={disabledDaysOfWeek}
          />
        </div>
      )}
    </div>
  )
}

DatePicker.displayName = 'DatePicker'
