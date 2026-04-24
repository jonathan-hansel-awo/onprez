'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Calendar, Check, Image as ImageIcon } from 'lucide-react'

interface Step2ScreensProps {
  active: boolean
}

type Theme = {
  id: string
  label: string
  // Tailwind gradient classes for the avatar / CTA
  avatar: string
  cta: string
  bg: string
  textAccent: string
  ring: string
}

const THEMES: Theme[] = [
  {
    id: 'indigo',
    label: 'Indigo',
    avatar: 'from-indigo-500 via-blue-500 to-purple-500',
    cta: 'from-indigo-600 to-blue-600',
    bg: 'from-indigo-50/60 via-white to-white',
    textAccent: 'text-indigo-600',
    ring: 'shadow-indigo-500/30',
  },
  {
    id: 'rose',
    label: 'Rose',
    avatar: 'from-rose-500 via-pink-500 to-fuchsia-500',
    cta: 'from-rose-600 to-pink-600',
    bg: 'from-rose-50/60 via-white to-white',
    textAccent: 'text-rose-600',
    ring: 'shadow-rose-500/30',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    avatar: 'from-emerald-500 via-teal-500 to-cyan-500',
    cta: 'from-emerald-600 to-teal-600',
    bg: 'from-emerald-50/60 via-white to-white',
    textAccent: 'text-emerald-600',
    ring: 'shadow-emerald-500/30',
  },
  {
    id: 'amber',
    label: 'Amber',
    avatar: 'from-amber-500 via-orange-500 to-rose-500',
    cta: 'from-amber-600 to-orange-600',
    bg: 'from-amber-50/60 via-white to-white',
    textAccent: 'text-amber-600',
    ring: 'shadow-amber-500/30',
  },
]

type Layout = 'stacked' | 'grid'

/**
 * Step 2 animation sequence (total ~6s):
 *  0.0s — start on default (indigo, stacked)
 *  1.2s — switch to rose
 *  2.4s — switch to emerald
 *  3.6s — switch to layout: grid
 *  4.8s — toggle gallery section on (briefly highlight)
 */
export function Step2Screens({ active }: Step2ScreensProps) {
  const [themeIndex, setThemeIndex] = useState(0)
  const [layout, setLayout] = useState<Layout>('stacked')
  const [galleryOn, setGalleryOn] = useState(false)
  const [hoveredControl, setHoveredControl] = useState<string | null>(null)

  useEffect(() => {
    if (!active) {
      setThemeIndex(0)
      setLayout('stacked')
      setGalleryOn(false)
      setHoveredControl(null)
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(
      setTimeout(() => {
        setHoveredControl('theme-rose')
        setThemeIndex(1)
      }, 1200)
    )
    timers.push(
      setTimeout(() => {
        setHoveredControl('theme-emerald')
        setThemeIndex(2)
      }, 2400)
    )
    timers.push(
      setTimeout(() => {
        setHoveredControl('layout-grid')
        setLayout('grid')
      }, 3600)
    )
    timers.push(
      setTimeout(() => {
        setHoveredControl('section-gallery')
        setGalleryOn(true)
      }, 4800)
    )
    timers.push(setTimeout(() => setHoveredControl(null), 5600))

    return () => timers.forEach(clearTimeout)
  }, [active])

  const theme = THEMES[themeIndex]

  return (
    <div className="flex h-full w-full bg-slate-100">
      {/* Customisation sidebar */}
      <div className="flex w-[28%] flex-col gap-[6%] border-r border-slate-200 bg-white px-[4%] py-[4%]">
        <div className="mb-[2%]">
          <h4 className="text-[8px] font-bold text-slate-900">Customise</h4>
          <p className="mt-[2%] text-[6px] text-slate-500">Changes preview instantly</p>
        </div>

        {/* Theme swatches */}
        <ControlGroup title="Theme">
          <div className="grid grid-cols-4 gap-[4%]">
            {THEMES.map((t, i) => (
              <motion.button
                key={t.id}
                type="button"
                animate={{
                  scale: hoveredControl === `theme-${t.id}` ? 1.15 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`relative aspect-square rounded-md bg-gradient-to-br ${t.avatar} ${
                  i === themeIndex ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                }`}
              >
                {i === themeIndex && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="h-[8px] w-[8px] text-white" strokeWidth={4} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </ControlGroup>

        {/* Layout toggle */}
        <ControlGroup title="Layout">
          <div className="flex gap-[4%] rounded-md bg-slate-100 p-[3%]">
            <LayoutButton
              active={layout === 'stacked'}
              highlighted={hoveredControl === 'layout-stacked'}
              onClick={() => setLayout('stacked')}
            >
              <div className="flex flex-col gap-[2px]">
                <div className="h-[2px] w-[14px] rounded-sm bg-current" />
                <div className="h-[2px] w-[14px] rounded-sm bg-current" />
                <div className="h-[2px] w-[14px] rounded-sm bg-current" />
              </div>
            </LayoutButton>
            <LayoutButton
              active={layout === 'grid'}
              highlighted={hoveredControl === 'layout-grid'}
              onClick={() => setLayout('grid')}
            >
              <div className="grid grid-cols-2 gap-[2px]">
                <div className="h-[5px] w-[5px] rounded-sm bg-current" />
                <div className="h-[5px] w-[5px] rounded-sm bg-current" />
                <div className="h-[5px] w-[5px] rounded-sm bg-current" />
                <div className="h-[5px] w-[5px] rounded-sm bg-current" />
              </div>
            </LayoutButton>
          </div>
        </ControlGroup>

        {/* Sections */}
        <ControlGroup title="Sections">
          <div className="space-y-[6%]">
            <ToggleRow label="Header" on />
            <ToggleRow label="Services" on />
            <ToggleRow
              label="Gallery"
              on={galleryOn}
              highlighted={hoveredControl === 'section-gallery'}
            />
            <ToggleRow label="Testimonials" on={false} />
          </div>
        </ControlGroup>
      </div>

      {/* Live preview */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-[3%]">
        <motion.div
          key={theme.id + layout + galleryOn}
          initial={{ scale: 0.98, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full w-full overflow-hidden rounded-lg bg-gradient-to-b ${theme.bg} shadow-md`}
        >
          {/* Avatar + name */}
          <div className="flex flex-col items-center px-[6%] pt-[6%]">
            <motion.div
              layoutId="s2-avatar"
              className={`flex h-[32px] w-[32px] items-center justify-center rounded-full bg-gradient-to-br ${theme.avatar} text-[11px] font-bold text-white shadow-lg ${theme.ring} ring-4 ring-white`}
            >
              SA
            </motion.div>
            <h3 className="mt-[2%] text-[10px] font-bold text-slate-900">Sarah Ace</h3>
            <p className="text-[6.5px] text-slate-500">Coach &amp; Consultant</p>

            <button
              type="button"
              className={`mt-[3%] flex items-center gap-[4%] rounded-full bg-gradient-to-r ${theme.cta} px-[5%] py-[2%] text-[7.5px] font-semibold text-white shadow-md ${theme.ring}`}
            >
              <Calendar className="h-[8px] w-[8px]" strokeWidth={2.5} />
              Book now
            </button>
          </div>

          {/* Services — layout-driven */}
          <div className="px-[6%] pt-[5%]">
            <AnimatePresence mode="wait">
              {layout === 'stacked' ? (
                <motion.div
                  key="stacked"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-[3%]"
                >
                  <ServiceRow title="1-on-1 Coaching" price="£95" theme={theme} />
                  <ServiceRow title="Group Session" price="£45" theme={theme} />
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 gap-[4%]"
                >
                  <ServiceTile title="1-on-1" price="£95" theme={theme} />
                  <ServiceTile title="Group" price="£45" theme={theme} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gallery appears when toggled on */}
          <AnimatePresence>
            {galleryOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-[4%] overflow-hidden px-[6%]"
              >
                <div className="mb-[2%] flex items-center gap-[3%]">
                  <ImageIcon className={`h-[8px] w-[8px] ${theme.textAccent}`} strokeWidth={2.5} />
                  <span className="text-[7px] font-semibold text-slate-700">Gallery</span>
                </div>
                <div className="grid grid-cols-3 gap-[2%]">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                      className={`aspect-square rounded-md bg-gradient-to-br ${theme.avatar} opacity-70`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

/* ---------- Sub-components ---------- */

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-[4%] text-[6px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      {children}
    </div>
  )
}

function LayoutButton({
  active,
  highlighted,
  onClick,
  children,
}: {
  active: boolean
  highlighted: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={{ scale: highlighted ? 1.08 : 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-1 items-center justify-center rounded-[4px] py-[10%] ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
      }`}
    >
      {children}
    </motion.button>
  )
}

function ToggleRow({
  label,
  on,
  highlighted,
}: {
  label: string
  on: boolean
  highlighted?: boolean
}) {
  return (
    <motion.div
      animate={{
        backgroundColor: highlighted ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0)',
      }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between rounded-md px-[3%] py-[4%]"
    >
      <span className="text-[7px] text-slate-700">{label}</span>
      <motion.div
        animate={{
          backgroundColor: on ? '#4f46e5' : '#e2e8f0',
        }}
        className="relative h-[10px] w-[18px] rounded-full"
      >
        <motion.div
          animate={{ x: on ? 8 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="absolute left-[1px] top-[1px] h-[8px] w-[8px] rounded-full bg-white shadow-sm"
        />
      </motion.div>
    </motion.div>
  )
}

function ServiceRow({ title, price, theme }: { title: string; price: string; theme: Theme }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-[4%] py-[3%]">
      <div>
        <p className="text-[7px] font-semibold text-slate-900">{title}</p>
        <p className="mt-[2%] text-[5.5px] text-slate-500">50 min session</p>
      </div>
      <div className={`text-[9px] font-bold ${theme.textAccent}`}>{price}</div>
    </div>
  )
}

function ServiceTile({ title, price, theme }: { title: string; price: string; theme: Theme }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-[6%]">
      <div className={`mb-[4%] h-[14px] w-[14px] rounded bg-gradient-to-br ${theme.avatar}`} />
      <p className="text-[7px] font-semibold text-slate-900">{title}</p>
      <p className={`mt-[2%] text-[8px] font-bold ${theme.textAccent}`}>{price}</p>
    </div>
  )
}
