'use client'

import { motion } from 'framer-motion'
import { PricingPlan } from '@/data/pricing'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PricingCardProps {
  plan: PricingPlan
  index: number
}

export function PricingCard({ plan, index }: PricingCardProps) {
  const isPopular = plan.popular

  return (
    <motion.div
      className={cn(
        'relative bg-white rounded-2xl shadow-lg border-2 p-8 h-full flex flex-col',
        isPopular ? 'border-onprez-blue lg:scale-105 lg:-mt-4 lg:mb-4' : 'border-gray-200'
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{
        y: isPopular ? -10 : -5,
        boxShadow: isPopular
          ? '0 30px 60px rgba(59, 130, 246, 0.3)'
          : '0 20px 40px rgba(0,0,0,0.1)',
      }}
    >
      {/* Popular Badge */}
      {isPopular && (
        <motion.div
          className="absolute z-30 -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-onprez-blue to-onprez-purple text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2"
          initial={{ scale: 0, rotate: -180 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', delay: 0.3 }}
        >
          <Sparkles className="w-4 h-4" />
          Most Popular
        </motion.div>
      )}

      {/* Animated Border for Premium */}
      {isPopular && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899, #3B82F6)',
            backgroundSize: '300% 300%',
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Plan Name */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 text-sm">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-gray-900">£{plan.price}</span>
          <span className="text-gray-600">/mo</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">{plan.period}</p>
      </div>

      {/* CTA Button */}
      <motion.button
        className={cn(
          'w-full py-4 rounded-xl font-bold text-lg mb-8 transition-all',
          isPopular
            ? 'bg-gradient-to-r from-onprez-blue to-onprez-purple text-white shadow-lg'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {plan.cta}
      </motion.button>

      {/* Features List */}
      <div className="space-y-4 flex-1">
        {plan.features.map((feature, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + i * 0.05 }}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                isPopular ? 'bg-onprez-blue' : 'bg-onprez-green'
              )}
            >
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span
              className={cn(
                'text-sm',
                feature.startsWith('Everything') ? 'font-bold text-gray-900' : 'text-gray-700'
              )}
            >
              {feature}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Hover Glow Effect */}
      {isPopular && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-onprez-blue/10 to-onprez-purple/10 rounded-2xl pointer-events-none opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}
