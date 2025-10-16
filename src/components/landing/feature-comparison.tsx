'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Check, X, ChevronDown } from 'lucide-react'
import { featureComparison } from '@/data/pricing'

export function FeatureComparison() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="max-w-4xl mx-auto mt-16">
      {/* Toggle Button */}
      <div className="text-center mb-8">
        <motion.button
          className="text-onprez-blue font-semibold flex items-center gap-2 mx-auto hover:text-onprez-purple transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>{isExpanded ? 'Hide' : 'See'} Detailed Comparison</span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </div>

      {/* Comparison Table */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="grid grid-cols-3 gap-4 p-6">
                  <div className="font-bold text-gray-900">Features</div>
                  <div className="text-center font-bold text-gray-900">Free</div>
                  <div className="text-center font-bold text-gray-900">Premium</div>
                </div>
              </div>

              {/* Categories */}
              {featureComparison.map((category, categoryIndex) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                >
                  {/* Category Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                    <h4 className="font-bold text-gray-900">{category.category}</h4>
                  </div>

                  {/* Features */}
                  {category.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: categoryIndex * 0.1 + featureIndex * 0.05 }}
                    >
                      {/* Feature Name */}
                      <div className="text-sm text-gray-700">{feature.name}</div>

                      {/* Free Column */}
                      <div className="flex items-center justify-center">
                        {typeof feature.free === 'boolean' ? (
                          feature.free ? (
                            <Check className="w-5 h-5 text-onprez-green" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300" />
                          )
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">
                            {feature.free}
                          </span>
                        )}
                      </div>

                      {/* Premium Column */}
                      <div className="flex items-center justify-center">
                        {typeof feature.premium === 'boolean' ? (
                          feature.premium ? (
                            <Check className="w-5 h-5 text-onprez-blue" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300" />
                          )
                        ) : (
                          <span className="text-sm font-semibold text-onprez-blue">
                            {feature.premium}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
