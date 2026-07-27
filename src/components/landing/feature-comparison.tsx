'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Check, X, ChevronDown } from 'lucide-react'
import { featureComparison } from '@/data/pricing'

function ComparisonValue({ value, emphasis = false }: { value: boolean | string; emphasis?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className={`h-5 w-5 ${emphasis ? 'text-onprez-blue' : 'text-onprez-green'}`} />
    ) : (
      <X className="h-5 w-5 text-gray-300" />
    )
  }

  return (
    <span className={`text-sm font-semibold ${emphasis ? 'text-onprez-blue' : 'text-gray-900'}`}>
      {value}
    </span>
  )
}

export function FeatureComparison() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mx-auto mt-16 max-w-6xl">
      <div className="mb-8 text-center">
        <motion.button
          className="mx-auto flex items-center gap-2 font-semibold text-onprez-blue transition-colors hover:text-onprez-purple"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Hide' : 'See'} detailed comparison</span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="min-w-[760px]">
                <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="grid grid-cols-4 gap-4 p-6">
                    <div className="font-bold text-gray-900">Features</div>
                    <div className="text-center font-bold text-gray-900">Free</div>
                    <div className="text-center font-bold text-onprez-blue">Professional</div>
                    <div className="text-center font-bold text-gray-900">Business</div>
                  </div>
                </div>

                {featureComparison.map((category, categoryIndex) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                  >
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                      <h4 className="font-bold text-gray-900">{category.category}</h4>
                    </div>

                    {category.features.map((feature, featureIndex) => (
                      <motion.div
                        key={feature.name}
                        className="grid grid-cols-4 gap-4 border-b border-gray-100 p-6 transition-colors hover:bg-gray-50"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: categoryIndex * 0.1 + featureIndex * 0.05 }}
                      >
                        <div className="text-sm text-gray-700">{feature.name}</div>
                        <div className="flex items-center justify-center">
                          <ComparisonValue value={feature.free} />
                        </div>
                        <div className="flex items-center justify-center">
                          <ComparisonValue value={feature.professional} emphasis />
                        </div>
                        <div className="flex items-center justify-center">
                          <ComparisonValue value={feature.business} />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-gray-500">
              *Unlimited bookings are subject to fair use and platform abuse protections.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
