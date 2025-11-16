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
    <section className="theme-section-spacing" style={{ backgroundColor: 'var(--theme-bg)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-4 theme-heading"
            style={{ fontFamily: 'var(--theme-font-heading)' }}
          >
            {title}
          </h2>
          {description && (
            <p
              className="text-lg max-w-2xl mx-auto theme-body-text"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-text)',
                opacity: 0.8,
              }}
            >
              {description}
            </p>
          )}
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
