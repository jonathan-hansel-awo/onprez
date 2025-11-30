'use client'

import { motion } from 'framer-motion'
import { testimonials } from '@/data/testimonials'
import { TestimonialTile } from './testimonial-tiles'
import { useRouter } from 'next/navigation'

export function TestimonialsBento() {
  const router = useRouter()
  return (
    <section className="py-32 bg-gradient-to-b from-gray-50 to-white">
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
            Loved by Professionals
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of service professionals who&apos;ve transformed their business with
            OnPrez
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => {
            // Define grid spans based on size
            const spanClasses = {
              small: 'lg:col-span-1 lg:row-span-1',
              medium: 'lg:col-span-2 lg:row-span-1',
              large: 'md:col-span-2 lg:col-span-2 lg:row-span-2',
            }

            return (
              <div key={testimonial.id} className={spanClasses[testimonial.size]}>
                <TestimonialTile testimonial={testimonial} index={index} />
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600 mb-6">Ready to join them?</p>
          <motion.button
            className="bg-gradient-to-r from-onprez-blue to-onprez-purple text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-xl"
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('signup')}
          >
            Start Your Free Presence
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
