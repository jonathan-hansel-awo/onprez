'use client'

import { motion } from 'framer-motion'
import { pricingPlans } from '@/data/pricing'
import { PricingCard } from './pricing-card'
import { ValueCalculator } from './value-calculator'
import { FeatureComparison } from './feature-comparison'

export function PricingSection() {
  return (
    <section id="pricing" className="py-32 bg-gradient-to-b from-white via-blue-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Start Free. Grow When Ready.
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            No credit card required. Premium features when you need them.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
          {pricingPlans.map((plan, index) => (
            <PricingCard key={plan.id} plan={plan} index={index} />
          ))}
        </div>

        {/* Value Calculator */}
        <ValueCalculator />

        {/* Feature Comparison */}
        <FeatureComparison />

        {/* Bottom Note */}
        <motion.div
          className="text-center mt-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600 mb-4">
            All plans include our core features to help you manage your business effectively.
            Upgrade anytime as you grow.
          </p>
          <p className="text-sm text-gray-500">
            Questions?{' '}
            <a href="#" className="text-onprez-blue hover:underline font-semibold">
              Contact our team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
