'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { pricingPlans } from '@/data/pricing'
import { PricingCard } from './pricing-card'
import { ValueCalculator } from './value-calculator'
import { FeatureComparison } from './feature-comparison'

interface PricingSectionProps {
  showCalculator?: boolean
  showPageLink?: boolean
}

export function PricingSection({
  showCalculator = true,
  showPageLink = true,
}: PricingSectionProps) {
  return (
    <section
      id="pricing"
      className="bg-gradient-to-b from-white via-blue-50 to-white py-24 md:py-32"
    >
      <div className="container mx-auto px-4">
        <motion.div
          className="mx-auto mb-16 max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-onprez-blue">
            Simple pricing
          </p>
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Start free. Upgrade as your business grows.
          </h2>
          <p className="text-lg text-gray-600 md:text-xl">
            Every plan combines a professional online presence with integrated booking. No separate
            website builder or booking subscription required.
          </p>
        </motion.div>

        <div className="mx-auto mb-8 grid max-w-7xl gap-8 md:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <PricingCard key={plan.id} plan={plan} index={index} />
          ))}
        </div>

        {showPageLink && (
          <div className="mb-8 text-center">
            <Link href="/pricing" className="font-semibold text-onprez-blue hover:underline">
              View the full plan comparison
            </Link>
          </div>
        )}

        {showCalculator && <ValueCalculator />}
        <FeatureComparison />

        <motion.div
          className="mx-auto mt-16 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <p className="mb-4 text-gray-600">
            Change plans as your service catalogue, media library and booking volume grow.
          </p>
          <p className="text-sm text-gray-500">
            Ready to create your online presence?{' '}
            <Link href="/signup" className="font-semibold text-onprez-blue hover:underline">
              Claim your handle free
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
