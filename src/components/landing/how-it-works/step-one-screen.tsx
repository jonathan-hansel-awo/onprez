'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Check, CircleUser, Sparkles, BarChart3, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

type Phase = 'signup' | 'dashboard' | 'presence'

interface Step1ScreensProps {
  /** When true, the internal animation sequence plays. */
  active: boolean
}

/**
 * Step 1 animation sequence:
 *  0.0s - show signup form with pre-filled data
 *  2.0s - "click" submit button (scale pulse)
 *  2.8s - transition to dashboard screen
 *  4.5s - transition to live presence page
 *  6.5s - step auto-advances (handled by parent)
 */
export function Step1Screens({ active }: Step1ScreensProps) {
  const [phase, setPhase] = useState<Phase>('signup')
  const [buttonPressed, setButtonPressed] = useState(false)

  useEffect(() => {
    if (!active) {
      // Reset when step becomes inactive so it replays cleanly next time
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
      <div className="flex items-center justify-between border-b border-slate-200/70 px-[3%] py-[2%]">
        <div className="flex items-center gap-[1.5%]">
          <div className="h-[22px] w-[22px] rounded-md bg-gradient-to-br from-indigo-500 to-blue-600" />
          <span className="text-[10px] font-bold tracking-tight text-slate-900">OnPrez</span>
        </div>
        <span className="text-[8px] text-slate-400">Create your account</span>
      </div>

      {/* Centered form */}
      <div className="flex flex-1 items-center justify-center px-[6%]">
        <div className="w-full max-w-[82%] rounded-xl border border-slate-200/80 bg-white px-[5%] py-[5%] shadow-[0_8px_40px_-12px_rgba(15,23,42,0.08)]">
          <div className="mb-[5%] text-center">
            <h3 className="text-[11px] font-bold text-slate-900">Claim your handle</h3>
            <p className="mt-[2%] text-[7px] text-slate-500">Free forever. No card required.</p>
          </div>

          <div className="space-y-[4%]">
            <Field label="Full name" value="Sarah Ace" />
            <Field label="Email" value="sarah@sarahace.co.uk" />
            <HandleField value="sarah-ace" />

            <motion.div
              animate={buttonPressed ? { scale: [1, 0.96, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative pt-[2%]"
            >
              <button
                className="relative w-full overflow-hidden rounded-md bg-gradient-to-r from-indigo-600 to-blue-600 py-[3.5%] text-[9px] font-semibold text-white shadow-sm"
                type="button"
              >
                <motion.span
                  className="absolute inset-0 bg-white/25"
                  initial={{ x: '-100%' }}
                  animate={buttonPressed ? { x: '100%' } : { x: '-100%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <span className="relative flex items-center justify-center gap-[3%]">
                  {buttonPressed ? (
                    <>
                      <Check className="h-[10px] w-[10px]" strokeWidth={3} />
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
      <label className="text-[6.5px] font-medium text-slate-500">{label}</label>
      <div className="mt-[1.5%] flex h-[22px] items-center rounded-md border border-slate-200 bg-slate-50/60 px-[3%] text-[8px] text-slate-800">
        {value}
      </div>
    </div>
  )
}

function HandleField({ value }: { value: string }) {
  return (
    <div>
      <label className="text-[6.5px] font-medium text-slate-500">Your handle</label>
      <div className="mt-[1.5%] flex h-[22px] items-center overflow-hidden rounded-md border border-indigo-300 bg-white text-[8px] ring-2 ring-indigo-100">
        <span className="bg-slate-50 px-[2.5%] py-full text-slate-500">onprez.com/</span>
        <span className="px-[2%] font-medium text-indigo-600">{value}</span>
        <div className="ml-auto flex items-center gap-[2%] pr-[3%]">
          <Check className="h-[9px] w-[9px] text-emerald-500" strokeWidth={3} />
          <span className="text-[6.5px] font-medium text-emerald-600">Available</span>
        </div>
      </div>
    </div>
  )
}

function DashboardScreen() {
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
              i === 0 ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-500'
            }`}
          >
            <div
              className={`h-[6px] w-[6px] rounded-sm ${i === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}
            />
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col px-[3%] py-[3%]">
        {/* Header */}
        <div className="mb-[3%] flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-bold text-slate-900">Welcome back, Sarah</h3>
            <p className="text-[7px] text-slate-500">Here&apos;s what&apos;s happening today</p>
          </div>
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[8px] font-bold text-white">
            SA
          </div>
        </div>

        {/* Stats */}
        <div className="mb-[3%] grid grid-cols-3 gap-[2%]">
          <StatCard icon="bookings" label="Bookings" value="0" accent="indigo" />
          <StatCard icon="views" label="Page views" value="0" accent="blue" />
          <StatCard icon="rating" label="Your handle" value="@sarah-ace" accent="emerald" isText />
        </div>

        {/* Empty state */}
        <div className="flex-1 rounded-lg border border-dashed border-slate-300 bg-white/60 p-[3%]">
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-[3%] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-indigo-50">
              <Sparkles className="h-[12px] w-[12px] text-indigo-500" />
            </div>
            <p className="text-[8px] font-semibold text-slate-900">Your presence is live!</p>
            <p className="mt-[1%] text-[6.5px] text-slate-500">
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
    bookings: <Calendar className="h-[9px] w-[9px]" />,
    views: <BarChart3 className="h-[9px] w-[9px]" />,
    rating: <CircleUser className="h-[9px] w-[9px]" />,
  }[icon]

  const accentClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }[accent]

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-[8%] py-[8%]">
      <div className="mb-[8%] flex items-center gap-[8%]">
        <div
          className={`flex h-[14px] w-[14px] items-center justify-center rounded ${accentClasses}`}
        >
          {iconEl}
        </div>
        <span className="text-[6.5px] text-slate-500">{label}</span>
      </div>
      <div className={`${isText ? 'text-[8px]' : 'text-[13px]'} font-bold text-slate-900`}>
        {value}
      </div>
    </div>
  )
}

function PresenceScreen() {
  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-indigo-50/60 via-white to-white">
      {/* Browser chrome */}
      <div className="flex items-center gap-[2%] border-b border-slate-200 bg-slate-50 px-[3%] py-[1.5%]">
        <div className="flex gap-[1%]">
          <div className="h-[6px] w-[6px] rounded-full bg-red-300" />
          <div className="h-[6px] w-[6px] rounded-full bg-amber-300" />
          <div className="h-[6px] w-[6px] rounded-full bg-emerald-300" />
        </div>
        <div className="ml-[3%] flex flex-1 items-center justify-center rounded-md bg-white py-[0.6%] text-[7px] text-slate-500 shadow-inner">
          <span className="font-medium text-indigo-600">onprez.com/</span>
          <span>sarah-ace</span>
        </div>
      </div>

      {/* Page content */}
      <div className="flex flex-1 flex-col items-center px-[6%] pt-[4%]">
        {/* Avatar */}
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 text-[13px] font-bold text-white shadow-lg shadow-indigo-500/30 ring-4 ring-white">
          SA
        </div>
        {/* Name + title */}
        <h3 className="mt-[2.5%] text-[12px] font-bold text-slate-900">Sarah Ace</h3>
        <p className="text-[7px] text-slate-500">Welcome to my presence page</p>

        {/* CTA */}
        <button
          type="button"
          className="mt-[4%] flex items-center gap-[4%] rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-[6%] py-[2%] text-[8.5px] font-semibold text-white shadow-lg shadow-indigo-500/30"
        >
          <Calendar className="h-[9px] w-[9px]" strokeWidth={2.5} />
          Book an appointment
        </button>

        {/* Service card */}
        <div className="mt-[5%] w-full rounded-xl border border-slate-200 bg-white px-[4%] py-[3%] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] font-semibold text-slate-900">Your first service</p>
              <p className="mt-[1%] text-[6.5px] text-slate-500">
                Add services from your dashboard
              </p>
            </div>
            <div className="flex items-center gap-[4%] rounded-md bg-amber-50 px-[4%] py-[2%]">
              <Star className="h-[7px] w-[7px] fill-amber-400 text-amber-400" />
              <span className="text-[6.5px] font-semibold text-amber-700">New</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
