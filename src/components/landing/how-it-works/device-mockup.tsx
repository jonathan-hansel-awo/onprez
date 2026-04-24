'use client'

import { ReactNode } from 'react'

interface DeviceMockupProps {
  children: ReactNode
}

/**
 * Renders ONE responsive device frame that crossfades the screen content inside.
 *
 * Uses pure CSS breakpoints so only the correct frame for the current viewport
 * size is visible. All three frames share the same internal "screen" that the
 * children render into — this keeps the animation inside consistent.
 *
 * Breakpoints:
 *  - lg+  (≥1024px): laptop (16:10 screen + lid/base)
 *  - md   (≥768px, <1024px): tablet (4:3 ish, rounded bezel)
 *  - sm   (<768px): phone (9:19.5, notch)
 */
export function DeviceMockup({ children }: DeviceMockupProps) {
  return (
    <>
      {/* Laptop — lg and up */}
      <div className="hidden lg:block">
        <LaptopFrame>{children}</LaptopFrame>
      </div>

      {/* Tablet — md to lg */}
      <div className="hidden md:block lg:hidden">
        <TabletFrame>{children}</TabletFrame>
      </div>

      {/* Phone — below md */}
      <div className="block md:hidden">
        <PhoneFrame>{children}</PhoneFrame>
      </div>
    </>
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
        {/* Screen */}
        <div className="aspect-[16/10] w-full overflow-hidden rounded-[6px] bg-white">
          {children}
        </div>
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
      <div className="relative rounded-[24px] bg-gradient-to-b from-slate-800 to-slate-900 p-[12px] shadow-[0_25px_60px_-20px_rgba(15,23,42,0.4),0_0_0_1px_rgba(15,23,42,0.3)]">
        {/* Front camera */}
        <div className="absolute left-1/2 top-[4px] h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-slate-600" />
        <div className="aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ---------- Phone ---------- */

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="relative rounded-[32px] bg-gradient-to-b from-slate-800 to-slate-900 p-[8px] shadow-[0_20px_50px_-15px_rgba(15,23,42,0.4),0_0_0_1px_rgba(15,23,42,0.3)]">
        {/* Screen — this gives us a phone-ish aspect that still fits a laptop-like UI */}
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[24px] bg-white">
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-[6px] z-10 h-[14px] w-[60px] -translate-x-1/2 rounded-full bg-slate-900" />
          {children}
        </div>
      </div>
    </div>
  )
}
