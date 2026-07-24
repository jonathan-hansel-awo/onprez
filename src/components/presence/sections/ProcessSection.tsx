'use client'

import { motion } from 'framer-motion'
import { ArrowDown, Check } from 'lucide-react'
import type { ProcessSection as ProcessSectionType } from '@/types/page-sections'
import { cn } from '@/lib/utils/cn'
import {
  getAccentColor,
  getContentWidth,
  getSectionSpacing,
  getSectionStyle,
} from './section-style'

interface ProcessSectionProps {
  section: ProcessSectionType
}

export function ProcessSection({ section }: ProcessSectionProps) {
  const { eyebrow, title, description, layout = 'steps', columns = 3, steps } = section.data
  const accentColor = getAccentColor(section.appearance)

  if (steps.length === 0) return null

  return (
    <section
      id={section.id}
      className={cn('relative isolate overflow-hidden', getSectionSpacing(section.appearance))}
      style={getSectionStyle(section.appearance, '#F7F8F5', '#1F2933')}
    >
      <div
        className="absolute -left-32 bottom-[-10rem] -z-10 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: `${accentColor}18` }}
        aria-hidden="true"
      />

      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-10 max-w-3xl text-center sm:mb-14"
        >
          {eyebrow && (
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.26em]"
              style={{ color: accentColor }}
            >
              {eyebrow}
            </p>
          )}
          <h2
            className="text-[clamp(2.5rem,11vw,4.75rem)] font-bold leading-[0.96] tracking-[-0.04em]"
            style={{ fontFamily: 'var(--theme-font-heading)' }}
          >
            {title}
          </h2>
          {description && (
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed opacity-75 sm:text-lg">
              {description}
            </p>
          )}
        </motion.div>

        {layout === 'timeline' ? (
          <div className="mx-auto max-w-3xl">
            {steps.map((step, index) => (
              <motion.article
                key={step.id}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.08, 0.3) }}
                className="relative grid grid-cols-[48px_1fr] gap-5 pb-10 last:pb-0"
              >
                <div className="relative flex justify-center">
                  <span
                    className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-inherit text-sm font-bold"
                    style={{ borderColor: accentColor, color: accentColor }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {index < steps.length - 1 && (
                    <span
                      className="absolute bottom-[-0.25rem] top-11 w-px"
                      style={{ backgroundColor: `${accentColor}55` }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="pt-1">
                  <h3
                    className="text-2xl font-bold leading-tight"
                    style={{ fontFamily: 'var(--theme-font-heading)' }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-relaxed opacity-75">{step.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-5',
              columns === 2 && 'md:grid-cols-2',
              columns === 3 && 'md:grid-cols-3',
              columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4'
            )}
          >
            {steps.map((step, index) => (
              <motion.article
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.08, 0.3) }}
                className={cn(
                  'relative min-w-0 border border-current/10 p-6 sm:p-7',
                  layout === 'cards'
                    ? 'bg-white/80 shadow-[0_18px_50px_rgba(0,0,0,0.08)]'
                    : 'border-t-2 bg-transparent'
                )}
                style={{
                  borderRadius: layout === 'cards' ? 'var(--theme-radius)' : undefined,
                  borderTopColor: accentColor,
                }}
              >
                <div className="mb-7 flex items-center justify-between gap-3">
                  <span
                    className="text-sm font-bold tracking-[0.18em]"
                    style={{ color: accentColor }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {layout === 'cards' ? (
                    <Check className="h-5 w-5" style={{ color: accentColor }} aria-hidden="true" />
                  ) : (
                    index < steps.length - 1 && (
                      <ArrowDown className="h-5 w-5 opacity-30 md:hidden" aria-hidden="true" />
                    )
                  )}
                </div>
                <h3
                  className="text-2xl font-bold leading-tight"
                  style={{ fontFamily: 'var(--theme-font-heading)' }}
                >
                  {step.title}
                </h3>
                <p className="mt-3 leading-relaxed opacity-75">{step.description}</p>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
