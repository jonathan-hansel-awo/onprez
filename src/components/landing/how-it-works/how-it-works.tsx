'use client'

import { StepId, STEPS } from '@/types/how-it-works'
import { AnimatePresence, motion, useInView, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { StepList } from './step-list'
import { DeviceMockup } from './device-mockup'
import { Step1Screens } from './step-one-screen'
import { Step2Screens } from './step-two-screen'
import { Step3Screens } from './step-three-screen'
import { StepDots } from './step-dots'

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { amount: 0.3, once: false })

  const [activeStep, setActiveStep] = useState<StepId>(1)
  // Once the user manually interacts, auto-advance is paused for the rest of
  // the session. This matches the common "don't fight the user" pattern.
  //   const [userTookControl, setUserTookControl] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  /* ---------- Auto-advance timer ---------- */

  useEffect(() => {
    // Wait until the section scrolls into view before starting the sequence
    if (!inView) return
    // if (userTookControl) return

    if (!hasStarted) {
      setHasStarted(true)
    }

    const duration = STEPS.find(s => s.id === activeStep)?.duration ?? 6000
    const timer = setTimeout(() => {
      setActiveStep(current => {
        const nextId = current === 3 ? 1 : ((current + 1) as StepId)
        return nextId
      })
    }, duration)

    return () => clearTimeout(timer)
  }, [activeStep, inView, hasStarted])

  /* ---------- Navigation handlers ---------- */

  const goToStep = useCallback((id: StepId) => {
    // setUserTookControl(true)
    setActiveStep(id)
  }, [])

  const goNext = useCallback(() => {
    // setUserTookControl(true)
    setActiveStep(current => (current === 3 ? 1 : ((current + 1) as StepId)))
  }, [])

  const goPrev = useCallback(() => {
    // setUserTookControl(true)
    setActiveStep(current => (current === 1 ? 3 : ((current - 1) as StepId)))
  }, [])

  /* ---------- Keyboard support ---------- */

  useEffect(() => {
    if (!inView) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inView, goNext, goPrev])

  /* ---------- Swipe support (mobile) ---------- */

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50
      if (info.offset.x < -threshold) {
        goNext()
      } else if (info.offset.x > threshold) {
        goPrev()
      }
    },
    [goNext, goPrev]
  )

  /* ---------- Render ---------- */

  return (
    <section
      ref={sectionRef}
      aria-labelledby="how-it-works-title"
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white py-20 sm:py-28 lg:py-32"
    >
      {/* Ambient background flourishes — matches the homepage aesthetic */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-purple-500/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/60 px-4 py-1.5 text-xs font-medium text-indigo-700 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            How it works
          </div>
          <h2
            id="how-it-works-title"
            className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
          >
            From zero to booked
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              in three steps.
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-600">
            No website. No code. Just your handle, your page, and bookings rolling in.
          </p>
        </div>

        {/* Main content grid */}
        <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:items-center">
          {/* Steps — on desktop, left. On mobile, below the device. */}
          <div className="order-2 lg:order-1">
            <StepList activeStep={activeStep} onStepClick={goToStep} />
          </div>

          {/* Device mockup — on desktop, right. On mobile, on top. */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* Chevron arrows — visible only on mobile/tablet */}
              <button
                type="button"
                aria-label="Previous step"
                onClick={goPrev}
                className="absolute left-0 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg backdrop-blur-sm transition hover:bg-white hover:text-indigo-600 active:scale-95 lg:hidden"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                aria-label="Next step"
                onClick={goNext}
                className="absolute right-0 top-1/2 z-20 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg backdrop-blur-sm transition hover:bg-white hover:text-indigo-600 active:scale-95 lg:hidden"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </button>

              {/* Draggable mockup — swipe to advance on touch devices */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                className="cursor-grab touch-pan-y active:cursor-grabbing lg:cursor-default"
              >
                <DeviceMockup>
                  <div className="relative h-full w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`step-${activeStep}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 h-full w-full"
                      >
                        {activeStep === 1 && <Step1Screens active={hasStarted} />}
                        {activeStep === 2 && <Step2Screens active={hasStarted} />}
                        {activeStep === 3 && <Step3Screens active={hasStarted} />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </DeviceMockup>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Dot slider */}
        <div className="mt-12 lg:mt-16">
          <StepDots activeStep={activeStep} onStepClick={goToStep} progress={0} paused={false} />
        </div>
      </div>
    </section>
  )
}
