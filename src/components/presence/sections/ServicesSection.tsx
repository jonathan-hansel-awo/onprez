'use client'

import { ServicesSection as ServicesSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Clock, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface ServicesSectionProps {
  section: ServicesSectionType
  businessHandle: string
}

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category?: string
  image?: string
}

export function ServicesSection({ section, businessHandle }: ServicesSectionProps) {
  const { title, description, layout, showPrices, serviceIds } = section.data
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [serviceIds])

  async function fetchServices() {
    try {
      const ids = serviceIds?.join(',') || ''
      const response = await fetch(`/api/public/businesses/${businessHandle}/services?ids=${ids}`)
      const data = await response.json()
      if (data.success) {
        setServices(data.data.services)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const isGrid = layout === 'grid'

  return (
    <section className="py-16 md:py-24 bg-gray-50">
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

        {/* Services Grid/List */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No services available at the moment.</p>
          </div>
        ) : (
          <div
            className={
              isGrid
                ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'flex flex-col gap-6 max-w-3xl mx-auto'
            }
          >
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Service Image */}
                {service.image && (
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    <Image src={service.image} alt={service.name} fill className="object-cover" />
                  </div>
                )}

                {/* Service Details */}
                <div className="p-6">
                  {service.category && (
                    <span className="text-xs font-semibold text-onprez-blue uppercase tracking-wide">
                      {service.category}
                    </span>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3">{service.name}</h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>

                  {/* Service Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration} min</span>
                    </div>
                    {showPrices && (
                      <div className="font-semibold text-gray-900">£{service.price.toFixed(2)}</div>
                    )}
                  </div>

                  {/* Book Button */}
                  <Button className="w-full" size="sm">
                    <Link href={`/${businessHandle}/book/${service.id}`}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Now
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
