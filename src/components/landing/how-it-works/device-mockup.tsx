'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

interface DeviceMockupProps {
  children: ReactNode
}

/**
 * Internal design resolution. All screen content is authored at this fixed
 * pixel size, then scaled via CSS transform to fit whichever device frame
 * is rendering. This keeps every `h-[14px]`, `text-[8px]` etc. looking
 * identical across laptop, tablet, and phone.
 */
const DESIGN_WIDTH = 1000
const DESIGN_HEIGHT = 600

/**
 * Responsive device frames. All three frames share the same 5:3 aspect ratio
 * so the scaled inner screen fits cleanly in any of them. The phone is shown
 * in landscape orientation — unusual, but the trade-off is worth it for
 * readability of dashboard-style content.
 *
 * Breakpoints:
 *  - lg+  (≥1024px): laptop
 *  - md   (≥768px, <1024px): tablet
 *  - sm   (<768px): phone (landscape)
 */
export function DeviceMockup({ children }: DeviceMockupProps) {
  return (
    <>
      <div className="hidden lg:block">
        <LaptopFrame>
          <ScaledScreen>{children}</ScaledScreen>
        </LaptopFrame>
      </div>

      <div className="hidden md:block lg:hidden">
        <TabletFrame>
          <ScaledScreen>{children}</ScaledScreen>
        </TabletFrame>
      </div>

      <div className="block md:hidden">
        <PhoneFrame>
          <ScaledScreen>{children}</ScaledScreen>
        </PhoneFrame>
      </div>
    </>
  )
}

/* ---------- Auto-scaling screen wrapper ---------- */

/**
 * Renders children at a fixed DESIGN_WIDTH × DESIGN_HEIGHT and uses a CSS
 * transform scale to fit the parent container. The parent MUST have a
 * matching aspect ratio (5:3) for this to render without clipping.
 */
function ScaledScreen({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0) return
      setScale(rect.width / DESIGN_WIDTH)
    }

    update()

    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ---------- Laptop ---------- */

function LaptopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full max-w-[640px]">
      {/* Screen housing (lid) */}
      <div className="relative rounded-[14px] bg-gradient-to-b from-slate-800 to-slate-900 p-[10px] shadow-[0_25px_60px_-20px_rgba(15,23,42,0.4),0_0_0_1px_rgba(15,23,42,0.3)]">
        {/* Camera dot */}
        <div className="absolute left-1/2 top-[4px] h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-slate-700" />
        {/* Screen — 5:3 aspect ratio matches design canvas */}
        <div className="aspect-[5/3] w-full overflow-hidden rounded-[6px] bg-white">{children}</div>
      </div>

      {/* Base of laptop */}
      <div className="relative mx-auto -mt-[1px] h-[14px] w-[108%] -translate-x-[3.7%] rounded-b-[14px] bg-gradient-to-b from-slate-300 via-slate-200 to-slate-400 shadow-[0_4px_10px_-2px_rgba(15,23,42,0.15)]">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 h-[5px] w-[22%] -translate-x-1/2 rounded-b-md bg-slate-400/60" />
      </div>
    </div>
  )
}

/* ---------- Tablet ---------- */

function TabletFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="relative rounded-[24px] bg-gradient-to-b from-slate-800 to-slate-900 p-[14px] shadow-[0_25px_60px_-20px_rgba(15,23,42,0.4),0_0_0_1px_rgba(15,23,42,0.3)]">
        {/* Front camera — on the left since tablet is held landscape */}
        <div className="absolute left-[8px] top-1/2 h-[4px] w-[4px] -translate-y-1/2 rounded-full bg-slate-600" />
        {/* Screen — 5:3 aspect ratio matches design canvas */}
        <div className="aspect-[5/3] w-full overflow-hidden rounded-[14px] bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ---------- Phone (landscape) ---------- */

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="relative rounded-[28px] bg-gradient-to-b from-slate-800 to-slate-900 p-[8px] shadow-[0_20px_50px_-15px_rgba(15,23,42,0.4),0_0_0_1px_rgba(15,23,42,0.3)]">
        {/* Screen — 5:3 aspect ratio matches design canvas */}
        <div className="relative aspect-[5/3] w-full overflow-hidden rounded-[20px] bg-white">
          {/* Dynamic island — on the left since phone is landscape */}
          <div className="absolute left-[6px] top-1/2 z-10 h-[8px] w-[36px] -translate-y-1/2 rounded-full bg-slate-900" />
          {children}
        </div>
      </div>
    </div>
  )
}
