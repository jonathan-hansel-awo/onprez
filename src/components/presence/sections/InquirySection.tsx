'use client'

import { motion } from 'framer-motion'
import { InquiryForm } from '../InquiryForm'

interface InquirySectionProps {
  businessId: string
  businessName: string
  title?: string
  description?: string
}

export function InquirySection({
  businessId,
  businessName,
  title = 'Have Questions?',
  description = "We're here to help. Send us a message and we'll get back to you soon.",
}: InquirySectionProps) {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          {description && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <InquiryForm businessId={businessId} businessName={businessName} />
        </motion.div>
      </div>
    </section>
  )
}
