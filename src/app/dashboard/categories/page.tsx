'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/dialog'

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

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchBusinessAndCategories()
  }, [])

  const fetchBusinessAndCategories = async () => {
    try {
      // Fetch business
      const businessRes = await fetch('/api/business/current')

      if (!businessRes.ok) {
        console.error('Business fetch failed with status:', businessRes.status)
        setLoading(false)
        return
      }

      const businessData = await businessRes.json()

      if (!businessData.success) {
        console.error('Failed to fetch business:', businessData.error)
        setLoading(false)
        return
      }

      const currentBusinessId = businessData.data.business.id
      setBusinessId(currentBusinessId)

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

  const handleDelete = async () => {
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
          <h1 className="text-3xl font-bold">Service Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your services into categories</p>
        </div>
        <Button onClick={() => router.push('/dashboard/categories/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
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
        onConfirm={handleDelete}
        loading={deleting}
        variant="destructive"
      />
    </div>
  )
}
