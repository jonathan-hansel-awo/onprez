'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Check, CircleUser, Sparkles, BarChart3, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

type Phase = 'signup' | 'dashboard' | 'presence'

interface Step1ScreensProps {
  active: boolean
}

/**
 * Step 1 animation sequence:
 *  0.0s - show signup form with pre-filled data
 *  2.0s - "click" submit button (scale pulse)
 *  2.8s - transition to dashboard screen
 *  4.5s - transition to live presence page
 *  6.5s - step auto-advances (handled by parent)
 *
 * All pixel values tuned for the 1000×600 design canvas in DeviceMockup.
 */
export function Step1Screens({ active }: Step1ScreensProps) {
  console.log('Step1Screens rendering, active =', active)
  const [phase, setPhase] = useState<Phase>('signup')
  const [buttonPressed, setButtonPressed] = useState(false)

  useEffect(() => {
    if (!active) {
      setPhase('signup')
      setButtonPressed(false)
      return
    }

    const t1 = setTimeout(() => setButtonPressed(true), 2000)
    const t2 = setTimeout(() => setPhase('dashboard'), 2800)
    const t3 = setTimeout(() => setPhase('presence'), 4500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [active])

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        {phase === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <SignupScreen buttonPressed={buttonPressed} />
          </motion.div>
        )}
        {phase === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <DashboardScreen />
          </motion.div>
        )}
        {phase === 'presence' && (
          <motion.div
            key="presence"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <PresenceScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Sub-screens ---------- */

function SignupScreen({ buttonPressed }: { buttonPressed: boolean }) {
  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-slate-200/70 px-8 py-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600" />
          <span className="text-base font-bold tracking-tight text-slate-900">OnPrez</span>
        </div>
        <span className="text-sm text-slate-400">Create your account</span>
      </div>

      {/* Centered form */}
      <div className="flex flex-1 items-center justify-center px-10">
        <div className="w-full max-w-[440px] rounded-2xl border border-slate-200/80 bg-white px-9 py-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.12)]">
          <div className="mb-6 text-center">
            <h3 className="text-xl font-bold text-slate-900">Claim your handle</h3>
            <p className="mt-1.5 text-sm text-slate-500">Free forever. No card required.</p>
          </div>

          <div className="space-y-4">
            <Field label="Full name" value="Sarah Ace" />
            <Field label="Email" value="sarah@sarahace.co.uk" />
            <HandleField value="sarah-ace" />

            <motion.div
              animate={buttonPressed ? { scale: [1, 0.96, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative pt-2"
            >
              <button
                className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25"
                type="button"
              >
                <motion.span
                  className="absolute inset-0 bg-white/25"
                  initial={{ x: '-100%' }}
                  animate={buttonPressed ? { x: '100%' } : { x: '-100%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {buttonPressed ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={3} />
                      <span>Creating your presence…</span>
                    </>
                  ) : (
                    <span>Claim my handle</span>
                  )}
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="mt-1.5 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-800">
        {value}
      </div>
    </div>
  )
}

function HandleField({ value }: { value: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">Your handle</label>
      <div className="mt-1.5 flex h-10 items-center overflow-hidden rounded-lg border border-indigo-300 bg-white text-sm ring-2 ring-indigo-100">
        <span className="self-stretch bg-slate-50 px-2.5 leading-[2.5] text-slate-500">
          onprez.com/
        </span>
        <span className="px-2 font-medium text-indigo-600">{value}</span>
        <div className="ml-auto flex items-center gap-1.5 pr-3">
          <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
          <span className="text-[11px] font-medium text-emerald-600">Available</span>
        </div>
      </div>
    </div>
  )
}

function DashboardScreen() {
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
              i === 0 ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-500'
            }`}
          >
            <div
              className={`h-1.5 w-1.5 rounded-sm ${i === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}
            />
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden px-7 py-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Welcome back, Sarah</h3>
            <p className="mt-0.5 text-sm text-slate-500">Here&apos;s what&apos;s happening today</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
            SA
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-4">
          <StatCard icon="bookings" label="Bookings" value="0" accent="indigo" />
          <StatCard icon="views" label="Page views" value="0" accent="blue" />
          <StatCard icon="rating" label="Your handle" value="@sarah-ace" accent="emerald" isText />
        </div>

        {/* Empty state */}
        <div className="flex-1 rounded-xl border border-dashed border-slate-300 bg-white/60 p-6">
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <Sparkles className="h-7 w-7 text-indigo-500" strokeWidth={2} />
            </div>
            <p className="text-base font-semibold text-slate-900">Your presence is live!</p>
            <p className="mt-1 text-sm text-slate-500">
              onprez.com/sarah-ace is ready to take bookings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
  isText,
}: {
  icon: 'bookings' | 'views' | 'rating'
  label: string
  value: string
  accent: 'indigo' | 'blue' | 'emerald'
  isText?: boolean
}) {
  const iconEl = {
    bookings: <Calendar className="h-4 w-4" strokeWidth={2} />,
    views: <BarChart3 className="h-4 w-4" strokeWidth={2} />,
    rating: <CircleUser className="h-4 w-4" strokeWidth={2} />,
  }[icon]

  const accentClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }[accent]

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${accentClasses}`}>
          {iconEl}
        </div>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className={`${isText ? 'text-sm' : 'text-2xl'} font-bold text-slate-900`}>{value}</div>
    </div>
  )
}

function PresenceScreen() {
  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-indigo-50/60 via-white to-white">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <div className="ml-3 flex flex-1 items-center justify-center rounded-md bg-white py-1 text-xs text-slate-600 shadow-inner">
          <span className="font-medium text-indigo-600">onprez.com/</span>
          <span>sarah-ace</span>
        </div>
      </div>

      {/* Page content */}
      <div className="flex flex-1 flex-col items-center px-10 pt-8">
        {/* Avatar */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 text-2xl font-bold text-white shadow-xl shadow-indigo-500/30 ring-4 ring-white">
          SA
        </div>
        {/* Name + title */}
        <h3 className="mt-4 text-2xl font-bold text-slate-900">Sarah Ace</h3>
        <p className="mt-1 text-sm text-slate-500">Welcome to my presence page</p>

        {/* CTA */}
        <button
          type="button"
          className="mt-5 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30"
        >
          <Calendar className="h-4 w-4" strokeWidth={2.5} />
          Book an appointment
        </button>

        {/* Service card */}
        <div className="mt-6 w-full max-w-[460px] rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Your first service</p>
              <p className="mt-0.5 text-xs text-slate-500">Add services from your dashboard</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-semibold text-amber-700">New</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
