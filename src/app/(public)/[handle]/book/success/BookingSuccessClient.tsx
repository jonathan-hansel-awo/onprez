'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Download,
  Share2,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CalendarPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface Business {
  id: string
  name: string
  slug: string
  timezone: string
  address: string | null
  phone: string | null
  email: string | null
}

interface BookingDetails {
  id: string
  confirmationNumber: string
  status: string
  startTime: string
  endTime: string
  duration: number
  service: {
    name: string
    price: number
    duration: number
  }
  customer: {
    name: string
    email: string
  }
  business: {
    name: string
    timezone: string
    address: string | null
  }
  notes: string | null
  createdAt: string
}

interface BookingSuccessClientProps {
  business: Business
  confirmationNumber?: string
}

function formatTime(dateString: string, timezone: string): string {
  const date = new Date(dateString)
  return date
    .toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
  return `${hours} hr ${mins} min`
}

export function BookingSuccessClient({ business, confirmationNumber }: BookingSuccessClientProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchBooking() {
      if (!confirmationNumber) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/bookings?confirmationNumber=${confirmationNumber}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Booking not found')
          return
        }

        setBooking(result.data)
      } catch (err) {
        setError('Failed to load booking details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [confirmationNumber])

  const handleCopyConfirmation = async () => {
    if (!booking) return
    await navigator.clipboard.writeText(booking.confirmationNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddToCalendar = () => {
    if (!booking) return

    const startDate = new Date(booking.startTime)
    const endDate = new Date(booking.endTime)

    // Format for Google Calendar
    const formatForCal = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '')
    }

    const title = encodeURIComponent(`${booking.service.name} at ${booking.business.name}`)
    const details = encodeURIComponent(
      `Booking confirmation: ${booking.confirmationNumber}\n\nService: ${booking.service.name}\nDuration: ${formatDuration(booking.duration)}\n\nNotes: ${booking.notes || 'None'}`
    )
    const location = encodeURIComponent(booking.business.address || '')

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatForCal(startDate)}/${formatForCal(endDate)}&details=${details}&location=${location}`

    window.open(googleCalUrl, '_blank')
  }

  const handleDownloadICS = () => {
    if (!booking) return

    const startDate = new Date(booking.startTime)
    const endDate = new Date(booking.endTime)

    const formatForICS = (date: Date) => {
      return (
        date
          .toISOString()
          .replace(/-|:|\.\d+/g, '')
          .slice(0, -1) + 'Z'
      )
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OnPrez//Booking//EN
BEGIN:VEVENT
UID:${booking.id}@onprez.com
DTSTAMP:${formatForICS(new Date())}
DTSTART:${formatForICS(startDate)}
DTEND:${formatForICS(endDate)}
SUMMARY:${booking.service.name} at ${booking.business.name}
DESCRIPTION:Booking confirmation: ${booking.confirmationNumber}\\nService: ${booking.service.name}\\nDuration: ${formatDuration(booking.duration)}
LOCATION:${booking.business.address || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `booking-${booking.confirmationNumber}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (!booking) return

    const shareData = {
      title: `Booking at ${booking.business.name}`,
      text: `I just booked ${booking.service.name} at ${booking.business.name}!`,
      url: `${window.location.origin}/${business.slug}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(shareData.url)
      alert('Link copied to clipboard!')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    )
  }

  // Error state or no confirmation number
  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Booking Not Found'}</h1>
          <p className="text-gray-600 mb-8">
            We couldn&apos;t find the booking details. Please check your confirmation email or
            contact the business.
          </p>
          <Link href={`/${business.slug}`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {business.name}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your appointment has been successfully booked</p>
        </motion.div>

        {/* Confirmation Number */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Confirmation Number</p>
              <p className="text-2xl font-mono font-bold text-gray-900">
                {booking.confirmationNumber}
              </p>
            </div>
            <button
              onClick={handleCopyConfirmation}
              className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Copy confirmation number"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            A confirmation email has been sent to {booking.customer.email}
          </p>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6"
        >
          {/* Service Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">{booking.service.name}</h2>
            <p className="text-blue-100 text-sm">{booking.business.name}</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Date & Time */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{formatDate(booking.startTime)}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                  <Clock className="w-4 h-4" />
                  {formatTime(booking.startTime, booking.business.timezone)} -{' '}
                  {formatTime(booking.endTime, booking.business.timezone)}
                  <span className="text-gray-400">({formatDuration(booking.duration)})</span>
                </p>
              </div>
            </div>

            {/* Location */}
            {booking.business.address && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600">{booking.business.address}</p>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  £{booking.service.price.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Payment to be collected at appointment</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {/* Add to Calendar */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleAddToCalendar} className="w-full">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Google Calendar
            </Button>
            <Button variant="outline" onClick={handleDownloadICS} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download .ics
            </Button>
          </div>

          {/* Share */}
          <Button variant="outline" onClick={handleShare} className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Share with friends
          </Button>

          {/* Back to Business */}
          <Link href={`/${business.slug}`} className="block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {business.name}
            </Button>
          </Link>
        </motion.div>

        {/* Contact Info */}
        {(business.phone || business.email) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-gray-50 rounded-lg"
          >
            <p className="text-sm font-medium text-gray-700 mb-2">Need to make changes?</p>
            <p className="text-sm text-gray-600 mb-3">Contact the business directly:</p>
            <div className="space-y-2">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  {business.phone}
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  {business.email}
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-gray-500 mt-8"
        >
          Please arrive 5 minutes before your appointment time.
          <br />
          Cancellations must be made at least 24 hours in advance.
        </motion.p>
      </div>
    </div>
  )
}
