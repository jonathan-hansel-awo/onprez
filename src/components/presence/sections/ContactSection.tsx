'use client'

import { ContactSection as ContactSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Globe } from 'lucide-react'

interface ContactSectionProps {
  section: ContactSectionType
  businessData: {
    phone?: string
    email?: string
    address?: string
    city?: string
    zipCode?: string
    socialLinks?: {
      facebook?: string
      instagram?: string
      twitter?: string
      linkedin?: string
      website?: string
    }
  }
}

export function ContactSection({ section, businessData }: ContactSectionProps) {
  const { title, showPhone, showEmail, showAddress, showMap, showSocialMedia, mapEmbedUrl } =
    section.data

  const fullAddress = [businessData.address, businessData.city, businessData.zipCode]
    .filter(Boolean)
    .join(', ')

  const socialIcons = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    website: Globe,
  }

  return (
    <section className="theme-section-spacing py-16 md:py-24 bg-gray-50">
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
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {showPhone && businessData.phone && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-onprez-blue/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-onprez-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                  <a
                    href={`tel:${businessData.phone}`}
                    className="text-gray-600 hover:text-onprez-blue transition-colors"
                  >
                    {businessData.phone}
                  </a>
                </div>
              </div>
            )}

            {showEmail && businessData.email && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-onprez-blue/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-onprez-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a
                    href={`mailto:${businessData.email}`}
                    className="text-gray-600 hover:text-onprez-blue transition-colors break-all"
                  >
                    {businessData.email}
                  </a>
                </div>
              </div>
            )}

            {showAddress && fullAddress && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-onprez-blue/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-onprez-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                  <p className="theme-body-text" style={{ fontFamily: 'var(--theme-font-body)' }}>
                    {' '}
                    {fullAddress}
                  </p>
                </div>
              </div>
            )}

            {/* Social Media */}
            {showSocialMedia && businessData.socialLinks && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {Object.entries(businessData.socialLinks).map(([platform, url]) => {
                    if (!url) return null
                    const Icon = socialIcons[platform as keyof typeof socialIcons]
                    if (!Icon) return null

                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-onprez-blue/10 flex items-center justify-center hover:bg-onprez-blue hover:text-white transition-colors text-onprez-blue"
                        title={platform}
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Map */}
          {showMap && mapEmbedUrl && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="h-[400px] rounded-xl overflow-hidden shadow-lg"
            >
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
