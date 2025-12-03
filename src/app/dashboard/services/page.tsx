'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/form'
import { ConfirmDialog } from '@/components/ui/dialog'
import { StatCard } from '@/components/dashboard/stat-card'
import { toast } from 'sonner'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  Tag,
  GripVertical,
  FolderOpen,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Loading from '@/app/[handle]/loading'

interface ServiceCategory {
  id: string
  name: string
  description: string | null
  order: number
  color: string | null
  icon: string | null
}

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  imageUrl: string | null
  active: boolean
  featured: boolean
  order: number
  category: ServiceCategory | null
  _count?: {
    appointments: number
  }
}

interface Category {
  id: string
  name: string
  description: string | null
  order: number
  color: string | null
  icon: string | null
  _count: {
    services: number
  }
}

// SortableServiceCard Component
function SortableServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </button>
      <Card className="flex-1 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 flex-1">
              {service.imageUrl && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image src={service.imageUrl} alt={service.name} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  {!service.active && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      Inactive
                    </span>
                  )}
                  {service.featured && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                      Featured
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />£{Number(service.price).toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {service.duration} min
                  </span>
                  {service.category && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {service.category.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(service)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(service)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ServicesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'services'

  const [businessId, setBusinessId] = useState<string>('')
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    service: Service | null
    loading: boolean
  }>({
    open: false,
    service: null,
    loading: false,
  })
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<{
    open: boolean
    category: Category | null
    loading: boolean
  }>({
    open: false,
    category: null,
    loading: false,
  })

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch business
  const fetchBusiness = async () => {
    try {
      console.log('Fetching business...')
      const response = await fetch('/api/business/current')
      console.log('Business response status:', response.status)

      if (!response.ok) {
        throw new Error('Failed to fetch business')
      }

      const data = await response.json()
      console.log('Business data:', data)
      setBusinessId(data.id)
      return data.id
    } catch (error) {
      console.error('Fetch business error:', error)
      setError('Failed to load business information')
      toast.error('Failed to load business information')
      return null
    }
  }

  // Fetch services
  const fetchServices = async (busId?: string) => {
    const id = busId || businessId
    if (!id) return

    try {
      console.log('Fetching services for business:', id)
      const response = await fetch(`/api/services?businessId=${id}`)
      console.log('Services response status:', response.status)

      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }

      const data = await response.json()
      console.log('Services data:', data)
      setServices(data)
      setFilteredServices(data)
    } catch (error) {
      console.error('Fetch services error:', error)
      setError('Failed to load services')
      toast.error('Failed to load services')
    }
  }

  // Fetch categories
  const fetchCategories = async (busId?: string) => {
    const id = busId || businessId
    if (!id) return

    try {
      console.log('Fetching categories for business:', id)
      const response = await fetch(`/api/service-categories?businessId=${id}`)
      console.log('Categories response status:', response.status)

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      console.log('Categories data:', data)
      setCategories(data)
    } catch (error) {
      console.error('Fetch categories error:', error)
      setError('Failed to load categories')
      toast.error('Failed to load categories')
    }
  }

  // Initial load
  useEffect(() => {
    console.log('Component mounted, starting initial load...')
    const loadData = async () => {
      try {
        const busId = await fetchBusiness()
        if (busId) {
          await Promise.all([fetchServices(busId), fetchCategories(busId)])
        }
      } catch (error) {
        console.error('Load data error:', error)
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredServices(services)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = services.filter(
        service =>
          service.name.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query) ||
          service.category?.name.toLowerCase().includes(query)
      )
      setFilteredServices(filtered)
    }
  }, [searchQuery, services])

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = filteredServices.findIndex(s => s.id === active.id)
      const newIndex = filteredServices.findIndex(s => s.id === over.id)

      const newOrder = arrayMove(filteredServices, oldIndex, newIndex)
      setFilteredServices(newOrder)
      setServices(newOrder)

      // Save to database
      setIsReordering(true)
      try {
        const response = await fetch('/api/services/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceIds: newOrder.map(s => s.id),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save order')
        }

        toast.success('Service order updated')
      } catch (error) {
        console.error('Reorder error:', error)
        toast.error('Failed to update service order')
        // Revert on error
        fetchServices()
      } finally {
        setIsReordering(false)
      }
    }
  }

  // Handle edit
  const handleEdit = (service: Service) => {
    router.push(`/dashboard/services/${service.id}/edit`)
  }

  // Handle delete confirmation
  const confirmDelete = (service: Service) => {
    setDeleteDialog({
      open: true,
      service,
      loading: false,
    })
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.service) return

    setDeleteDialog(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/services/${deleteDialog.service.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete service')
      }

      toast.success('Service deleted successfully')
      setDeleteDialog({ open: false, service: null, loading: false })
      fetchServices()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete service')
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  // Handle category delete
  const confirmDeleteCategory = (category: Category) => {
    setDeleteCategoryDialog({
      open: true,
      category,
      loading: false,
    })
  }

  const handleDeleteCategory = async () => {
    if (!deleteCategoryDialog.category) return

    setDeleteCategoryDialog(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/service-categories/${deleteCategoryDialog.category.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      toast.success('Category deleted successfully')
      setDeleteCategoryDialog({ open: false, category: null, loading: false })
      fetchCategories()
    } catch (error) {
      console.error('Delete category error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
      setDeleteCategoryDialog(prev => ({ ...prev, loading: false }))
    }
  }

  // Tab navigation
  const setTab = (tab: string) => {
    router.push(`/dashboard/services?tab=${tab}`)
  }

  // Stats
  const activeServices = services.filter(s => s.active).length

  console.log('Render state:', {
    isLoading,
    error,
    servicesCount: services.length,
    categoriesCount: categories.length,
  })

  // Error state
  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services & Categories</h1>
          <p className="text-muted-foreground mt-1">Manage your bookable services and categories</p>
        </div>
        {currentTab === 'services' ? (
          <Link href="/dashboard/services/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard/categories/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Services"
          value={services.length}
          icon={Package}
          iconColor="text-blue-600"
          iconBackground="bg-blue-100"
        />
        <StatCard
          title="Active Services"
          value={activeServices}
          icon={Package}
          iconColor="text-green-600"
          iconBackground="bg-green-100"
        />
        <StatCard
          title="Categories"
          value={categories.length}
          icon={FolderOpen}
          iconColor="text-purple-600"
          iconBackground="bg-purple-100"
        />
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-8">
          <button
            onClick={() => setTab('services')}
            className={`pb-4 px-1 border-b-2 transition-colors ${
              currentTab === 'services'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setTab('categories')}
            className={`pb-4 px-1 border-b-2 transition-colors ${
              currentTab === 'categories'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {currentTab === 'services' ? (
        <>
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Services List with Drag-and-Drop */}
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No services found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Get started by creating your first service'}
                </p>
                {!searchQuery && (
                  <Link href="/dashboard/services/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredServices.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {filteredServices.map(service => (
                    <SortableServiceCard
                      key={service.id}
                      service={service}
                      onEdit={handleEdit}
                      onDelete={confirmDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {isReordering && (
            <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
              Saving order...
            </div>
          )}
        </>
      ) : (
        /* Categories List */
        <div className="space-y-4">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
                <p className="text-muted-foreground mb-4">
                  Organize your services by creating categories
                </p>
                <Link href="/dashboard/categories/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            categories.map(category => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: category.color || '#f3f4f6' }}
                      >
                        {category.icon || '📁'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {category._count.services} service
                          {category._count.services !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/categories/${category.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDeleteCategory(category)}
                        disabled={category._count.services > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Delete Service Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={open => setDeleteDialog(prev => ({ ...prev, open }))}
        title="Delete Service"
        description={`Are you sure you want to delete "${deleteDialog.service?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        loading={deleteDialog.loading}
        variant="destructive"
      />

      {/* Delete Category Dialog */}
      <ConfirmDialog
        open={deleteCategoryDialog.open}
        onOpenChange={open => setDeleteCategoryDialog(prev => ({ ...prev, open }))}
        title="Delete Category"
        description={
          (deleteCategoryDialog.category?._count.services ?? 0) > 0
            ? `Cannot delete "${deleteCategoryDialog.category?.name}" because it has ${deleteCategoryDialog.category?._count.services} assigned service(s). Please reassign or delete these services first.`
            : `Are you sure you want to delete "${deleteCategoryDialog.category?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteCategory}
        loading={deleteCategoryDialog.loading}
        variant="destructive"
        // disabled={(deleteCategoryDialog.category?._count.services ?? 0) > 0}
      />
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ServicesPageContent />
    </Suspense>
  )
}
