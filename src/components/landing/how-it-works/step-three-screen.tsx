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
 */
export function Step3Screens({ active }: Step3ScreensProps) {
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
      <div className="flex w-[16%] flex-col gap-[3%] border-r border-slate-200 bg-white px-[2%] py-[3%]">
        <div className="flex items-center gap-[6%] pb-[4%]">
          <div className="h-[14px] w-[14px] rounded bg-gradient-to-br from-indigo-500 to-blue-600" />
          <span className="text-[7px] font-bold text-slate-900">OnPrez</span>
        </div>
        {['Overview', 'Bookings', 'Presence', 'Analytics', 'Settings'].map((item, i) => (
          <div
            key={item}
            className={`flex items-center gap-[8%] rounded-md px-[8%] py-[8%] text-[6.5px] ${
              i === 1 ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-500'
            }`}
          >
            <div
              className={`h-[6px] w-[6px] rounded-sm ${i === 1 ? 'bg-indigo-500' : 'bg-slate-300'}`}
            />
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col px-[3%] py-[3%]">
        {/* Header + share link */}
        <div className="mb-[2.5%] flex items-start justify-between">
          <div>
            <h3 className="text-[11px] font-bold text-slate-900">Bookings</h3>
            <p className="text-[6.5px] text-slate-500">Your schedule, always up to date</p>
          </div>
          <ShareLinkBadge />
        </div>

        {/* Earnings card */}
        <EarningsCard total={totalEarnings} count={visibleCount} />

        {/* Bookings list */}
        <div className="mt-[2.5%] flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-[3%] py-[2.5%]">
            <span className="text-[7px] font-semibold text-slate-700">Upcoming</span>
            <span className="text-[6.5px] text-slate-500">{visibleCount} bookings</span>
          </div>

          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {visibleBookings.map(booking => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, x: 24, backgroundColor: 'rgba(99, 102, 241, 0.08)' }}
                  animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(255, 255, 255, 1)' }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{
                    opacity: { duration: 0.35 },
                    x: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                    backgroundColor: { duration: 1.2, delay: 0.3 },
                  }}
                  className="flex items-center gap-[3%] border-b border-slate-50 px-[3%] py-[2.5%] last:border-b-0"
                >
                  <div
                    className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${booking.gradient} text-[7px] font-bold text-white`}
                  >
                    {booking.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-[2%]">
                      <p className="truncate text-[7.5px] font-semibold text-slate-900">
                        {booking.name}
                      </p>
                      <p className="shrink-0 text-[6.5px] text-slate-400">{booking.time}</p>
                    </div>
                    <p className="mt-[1%] text-[6.5px] text-slate-500">{booking.service}</p>
                  </div>
                  <div className="shrink-0 text-[8px] font-bold text-emerald-600">
                    {booking.price}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {visibleCount === 0 && (
              <div className="flex flex-col items-center justify-center py-[6%]">
                <Calendar className="h-[14px] w-[14px] text-slate-300" />
                <p className="mt-[2%] text-[7px] text-slate-500">
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
      className="flex items-center gap-[4%] rounded-full border border-indigo-200 bg-indigo-50 px-[6%] py-[3%]"
    >
      <LinkIcon className="h-[8px] w-[8px] text-indigo-500" strokeWidth={2.5} />
      <span className="text-[6.5px] font-medium text-indigo-700">onprez.com/sarah-ace</span>
    </motion.div>
  )
}

function EarningsCard({ total, count }: { total: number; count: number }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 px-[3%] py-[2.5%]">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-[2%]">
            <TrendingUp className="h-[8px] w-[8px] text-emerald-600" strokeWidth={2.5} />
            <span className="text-[6.5px] font-semibold uppercase tracking-wider text-emerald-700">
              This week
            </span>
          </div>
          <motion.div
            key={total}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-[2%] text-[14px] font-bold text-slate-900"
          >
            £{total.toFixed(2)}
          </motion.div>
          <p className="text-[6px] text-slate-500">
            from {count} booking{count === 1 ? '' : 's'}
          </p>
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end gap-[3px] pr-[2%]">
          {[30, 50, 40, 70, 55, 90, 75].map((h, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0.2 }}
              animate={{ scaleY: Math.min(1, 0.2 + (count / 5) * (h / 100)) }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              style={{ transformOrigin: 'bottom', height: `${h * 0.25}px` }}
              className="w-[3px] rounded-sm bg-gradient-to-t from-emerald-400 to-emerald-500"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
