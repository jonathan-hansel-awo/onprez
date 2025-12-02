'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/form/input'
import { Plus, Search, Edit, Package, Trash2 } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { ConfirmDialog } from '@/components/ui/dialog'

interface Service {
  id: string
  name: string
  description: string | null
  tagline: string | null
  price: number
  duration: number
  imageUrl: string | null
  active: boolean
  featured: boolean
  category: {
    id: string
    name: string
    color: string | null
    icon: string | null
  } | null
}

interface Category {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  order: number
  _count: {
    services: number
  }
}

function ServicesComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'services'

  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const businessRes = await fetch('/api/business/current')
      const businessData = await businessRes.json()

      if (!businessData.success) {
        console.error('Failed to fetch business')
        return
      }

      const currentBusinessId = businessData.data.business.id
      setBusinessId(currentBusinessId)

      // Fetch services
      const servicesRes = await fetch(`/api/services?businessId=${currentBusinessId}`)
      const servicesData = await servicesRes.json()

      if (servicesData.success) {
        setServices(servicesData.data.services)
      }

      // Fetch categories
      const categoriesRes = await fetch(`/api/service-categories?businessId=${currentBusinessId}`)
      const categoriesData = await categoriesRes.json()

      if (categoriesData.success) {
        setCategories(categoriesData.data.categories)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/service-categories/${deleteId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setCategories(categories.filter(cat => cat.id !== deleteId))
        setDeleteId(null)
      } else {
        alert(data.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && service.active) ||
      (filterStatus === 'inactive' && !service.active)
    return matchesSearch && matchesStatus
  })

  const activeServices = services.filter(s => s.active).length
  const inactiveServices = services.filter(s => !s.active).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services & Categories</h1>
          <p className="text-muted-foreground mt-1">Manage your services and categories</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          <button
            onClick={() => router.push('/dashboard/services?tab=services')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              tab === 'services'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => router.push('/dashboard/services?tab=categories')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              tab === 'categories'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>
      </div>

      {/* Services Tab */}
      {tab === 'services' && (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total Services"
              value={services.length.toString()}
              icon={Package}
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="Active Services"
              value={activeServices.toString()}
              icon={Package}
              iconColor="text-green-600"
            />
            <StatCard
              title="Inactive Services"
              value={inactiveServices.toString()}
              icon={Package}
              iconColor="text-gray-400"
            />
          </div>

          {/* Filters & Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'primary' : 'outline'}
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterStatus === 'active' ? 'primary' : 'outline'}
                    onClick={() => setFilterStatus('active')}
                  >
                    Active
                  </Button>
                  <Button
                    variant={filterStatus === 'inactive' ? 'primary' : 'outline'}
                    onClick={() => setFilterStatus('inactive')}
                  >
                    Inactive
                  </Button>
                </div>
                <Button onClick={() => router.push('/dashboard/services/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No services found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Get started by creating your first service'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => router.push('/dashboard/services/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Service
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map(service => (
                <Card
                  key={service.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {service.imageUrl && (
                    <div className="aspect-video relative bg-gray-100">
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                      {service.featured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500">Featured</Badge>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        {service.tagline && (
                          <p className="text-sm text-muted-foreground mt-1">{service.tagline}</p>
                        )}
                      </div>
                      <Badge variant={service.active ? 'success' : 'default'}>
                        {service.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-lg">£{service.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">{service.duration} min</span>
                      </div>
                      {service.category && (
                        <Badge
                          variant="default"
                          className="text-xs"
                          style={{
                            backgroundColor: service.category.color
                              ? `${service.category.color}20`
                              : undefined,
                            color: service.category.color || undefined,
                          }}
                        >
                          {service.category.icon} {service.category.name}
                        </Badge>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/dashboard/services/${service.id}/edit`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => router.push('/dashboard/categories/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create categories to organize your services
                </p>
                <Button onClick={() => router.push('/dashboard/categories/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map(category => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {category.color && (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon || '📁'}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="default">
                        {category._count.services}{' '}
                        {category._count.services === 1 ? 'service' : 'services'}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/categories/${category.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(category.id)}
                          disabled={category._count.services > 0}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={deleteId !== null}
            onOpenChange={open => !open && setDeleteId(null)}
            title="Delete Category"
            description="Are you sure you want to delete this category? This action cannot be undone."
            confirmText="Delete"
            onConfirm={handleDeleteCategory}
            loading={deleting}
            variant="destructive"
          />
        </>
      )}
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <ServicesComponent />
    </Suspense>
  )
}
