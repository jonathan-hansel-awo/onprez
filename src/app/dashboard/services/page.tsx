'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  DollarSign,
  Clock,
  Image as ImageIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  imageUrl: string | null
  active: boolean
  featured: boolean
  category?: {
    id: string
    name: string
  } | null
}

export default function ServicesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [businessId, setBusinessId] = useState<string | null>(null)

  useEffect(() => {
    fetchBusinessAndServices()
  }, [])

  useEffect(() => {
    filterServices()
  }, [services, searchQuery, filterActive])

  async function fetchBusinessAndServices() {
    try {
      // Get user's business
      const businessRes = await fetch('/api/business/current')
      const businessData = await businessRes.json()

      if (!businessData.success || !businessData.data.business) {
        console.error('No business found')
        setLoading(false)
        return
      }

      const business = businessData.data.business
      setBusinessId(business.id)

      // Fetch services
      const servicesRes = await fetch(`/api/services?businessId=${business.id}`)
      const servicesData = await servicesRes.json()

      if (servicesData.success) {
        setServices(servicesData.data.services)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterServices() {
    let filtered = [...services]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        service =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by active status
    if (filterActive === 'active') {
      filtered = filtered.filter(service => service.active)
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter(service => !service.active)
    }

    setFilteredServices(filtered)
  }

  function handleAddService() {
    router.push('/dashboard/services/new')
  }

  function handleEditService(serviceId: string) {
    router.push(`/dashboard/services/${serviceId}/edit`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-onprez-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-2">Manage your bookable services</p>
        </div>
        <Button variant="primary" onClick={handleAddService}>
          <Plus className="w-5 h-5 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-onprez-blue/20 focus:border-onprez-blue"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterActive === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterActive('all')}
              >
                All ({services.length})
              </Button>
              <Button
                variant={filterActive === 'active' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterActive('active')}
              >
                Active ({services.filter(s => s.active).length})
              </Button>
              <Button
                variant={filterActive === 'inactive' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterActive('inactive')}
              >
                Inactive ({services.filter(s => !s.active).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filterActive !== 'all' ? 'No services found' : 'No services yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterActive !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first service to start accepting bookings'}
            </p>
            {!searchQuery && filterActive === 'all' && (
              <Button variant="primary" onClick={handleAddService}>
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Service
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredServices.map(service => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <Card className="h-full flex flex-col">
                  {/* Service Image */}
                  <div className="relative h-48 bg-gray-100">
                    {service.imageUrl ? (
                      <Image
                        src={service.imageUrl}
                        alt={service.name}
                        fill
                        className="object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    {/* Featured Badge */}
                    {service.featured && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="warning" size="sm">
                          Featured
                        </Badge>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge variant={service.active ? 'success' : 'default'} size="sm">
                        {service.active ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  {/* Service Details */}
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {service.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">£{Number(service.price).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} min</span>
                        </div>
                      </div>

                      {service.category && (
                        <div className="mt-3">
                          <Badge variant="purple" size="sm">
                            {service.category.name}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditService(service.id)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
