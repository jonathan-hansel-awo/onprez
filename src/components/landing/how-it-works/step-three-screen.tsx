'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Calendar, Link as LinkIcon, TrendingUp } from 'lucide-react'

interface Step3ScreensProps {
  active: boolean
}

interface Booking {
  id: number
  name: string
  service: string
  time: string
  price: string
  initials: string
  gradient: string
}

const BOOKINGS: Booking[] = [
  {
    id: 1,
    name: 'Emma Whitfield',
    service: '1-on-1 Coaching',
    time: 'Tomorrow, 10:00',
    price: '£95.00',
    initials: 'EW',
    gradient: 'from-rose-400 to-pink-500',
  },
  {
    id: 2,
    name: 'James Okafor',
    service: 'Group Session',
    time: 'Thu, 14:30',
    price: '£45.00',
    initials: 'JO',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 3,
    name: 'Priya Shah',
    service: '1-on-1 Coaching',
    time: 'Fri, 09:00',
    price: '£95.00',
    initials: 'PS',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    id: 4,
    name: 'Oliver Bennett',
    service: 'Strategy Call',
    time: 'Fri, 15:00',
    price: '£120.00',
    initials: 'OB',
    gradient: 'from-indigo-400 to-blue-500',
  },
  {
    id: 5,
    name: 'Amelia Clarke',
    service: 'Group Session',
    time: 'Mon, 11:00',
    price: '£45.00',
    initials: 'AC',
    gradient: 'from-purple-400 to-fuchsia-500',
  },
]

/**
 * Step 3 animation sequence (~6s):
 *  0.0s — empty bookings list, share URL visible
 *  0.8s — first booking appears (earnings tick up)
 *  1.8s — second
 *  2.6s — third
 *  3.4s — fourth
 *  4.2s — fifth
 *
 * All pixel values tuned for the 1000×600 design canvas in DeviceMockup.
 */
export function Step3Screens({ active }: Step3ScreensProps) {
  console.log('Step3Screens rendering, active =', active)
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!active) {
      setVisibleCount(0)
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    const schedule = [800, 1800, 2600, 3400, 4200]
    schedule.forEach((delay, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), delay))
    })

    return () => timers.forEach(clearTimeout)
  }, [active])

  const visibleBookings = BOOKINGS.slice(0, visibleCount)
  const totalEarnings = visibleBookings.reduce(
    (sum, b) => sum + parseFloat(b.price.replace('£', '')),
    0
  )

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Sidebar */}
      <div className="flex w-[180px] shrink-0 flex-col gap-1 border-r border-slate-200 bg-white px-3 py-5">
        <div className="mb-3 flex items-center gap-2 px-2">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 to-blue-600" />
          <span className="text-sm font-bold text-slate-900">OnPrez</span>
        </div>
        {['Overview', 'Bookings', 'Presence', 'Analytics', 'Settings'].map((item, i) => (
          <div
            key={item}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] ${
              i === 1 ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-500'
            }`}
          >
            <div
              className={`h-1.5 w-1.5 rounded-sm ${i === 1 ? 'bg-indigo-500' : 'bg-slate-300'}`}
            />
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden px-7 py-6">
        {/* Header + share link */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Bookings</h3>
            <p className="mt-0.5 text-sm text-slate-500">Your schedule, always up to date</p>
          </div>
          <ShareLinkBadge />
        </div>

        {/* Earnings card */}
        <EarningsCard total={totalEarnings} count={visibleCount} />

        {/* Bookings list */}
        <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">Upcoming</span>
            <span className="text-xs text-slate-500">
              {visibleCount} booking{visibleCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <AnimatePresence initial={false}>
              {visibleBookings.map(booking => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{
                    opacity: 0,
                    x: 40,
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{
                    opacity: { duration: 0.35 },
                    x: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                    backgroundColor: { duration: 1.2, delay: 0.3 },
                  }}
                  className="flex items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-b-0"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${booking.gradient} text-xs font-bold text-white`}
                  >
                    {booking.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {booking.name}
                      </p>
                      <p className="shrink-0 text-xs text-slate-400">{booking.time}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{booking.service}</p>
                  </div>
                  <div className="shrink-0 text-sm font-bold text-emerald-600">{booking.price}</div>
                </motion.div>
              ))}
            </AnimatePresence>

            {visibleCount === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center py-10">
                <Calendar className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                <p className="mt-2 text-sm text-slate-500">
                  Share your link to start receiving bookings
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Sub-components ---------- */

function ShareLinkBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex shrink-0 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5"
    >
      <LinkIcon className="h-3.5 w-3.5 text-indigo-500" strokeWidth={2.5} />
      <span className="text-xs font-medium text-indigo-700">onprez.com/sarah-ace</span>
    </motion.div>
  )
}

function EarningsCard({ total, count }: { total: number; count: number }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              This week
            </span>
          </div>
          <motion.div
            key={total}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 text-3xl font-bold text-slate-900"
          >
            £{total.toFixed(2)}
          </motion.div>
          <p className="text-xs text-slate-500">
            from {count} booking{count === 1 ? '' : 's'}
          </p>
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end gap-1 pr-1">
          {[30, 50, 40, 70, 55, 90, 75].map((h, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0.2 }}
              animate={{ scaleY: Math.min(1, 0.2 + (count / 5) * (h / 100)) }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              style={{ transformOrigin: 'bottom', height: `${h * 0.55}px` }}
              className="w-1.5 rounded-sm bg-gradient-to-t from-emerald-400 to-emerald-500"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
