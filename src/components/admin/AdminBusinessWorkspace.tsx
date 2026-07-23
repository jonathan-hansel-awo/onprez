'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

type BusinessDetails = {
  id: string
  name: string
  slug: string
  category: string
  tagline: string | null
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  isPublished: boolean
  isActive: boolean
  ownerEmail: string
}

type ServiceItem = {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  imageUrl: string | null
  active: boolean
  featured: boolean
  order: number
  appointmentCount: number
}

type ServiceDraft = {
  name: string
  description: string
  price: string
  duration: string
  imageUrl: string
  active: boolean
  featured: boolean
}

const emptyService: ServiceDraft = {
  name: '',
  description: '',
  price: '',
  duration: '60',
  imageUrl: '',
  active: true,
  featured: false,
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none ring-blue-500 focus:ring-2"
      />
    </label>
  )
}

export function AdminBusinessWorkspace({
  initialBusiness,
  initialServices,
  pageStatus,
}: {
  initialBusiness: BusinessDetails
  initialServices: ServiceItem[]
  pageStatus: { exists: boolean; isPublished: boolean; updatedAt: string | null }
}) {
  const [business, setBusiness] = useState(initialBusiness)
  const [services, setServices] = useState(initialServices)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [serviceSaving, setServiceSaving] = useState(false)
  const [serviceMessage, setServiceMessage] = useState<string | null>(null)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>(emptyService)

  function updateBusiness(field: keyof BusinessDetails, value: string) {
    setBusiness(current => ({ ...current, [field]: value }))
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setProfileSaving(true)
    setProfileMessage(null)

    try {
      const response = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: business.name,
          tagline: business.tagline || '',
          description: business.description || '',
          email: business.email || '',
          phone: business.phone || '',
          website: business.website || '',
          address: business.address || '',
          city: business.city || '',
          state: business.state || '',
          zipCode: business.zipCode || '',
          country: business.country || '',
          logoUrl: business.logoUrl || '',
          coverImageUrl: business.coverImageUrl || '',
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save business profile')
      }

      setBusiness(current => ({ ...current, ...result.data.business }))
      setProfileMessage('Business profile saved.')
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Failed to save business profile')
    } finally {
      setProfileSaving(false)
    }
  }

  function startEditing(service: ServiceItem) {
    setEditingServiceId(service.id)
    setServiceDraft({
      name: service.name,
      description: service.description || '',
      price: String(service.price),
      duration: String(service.duration),
      imageUrl: service.imageUrl || '',
      active: service.active,
      featured: service.featured,
    })
    setServiceMessage(null)
  }

  function resetServiceForm() {
    setEditingServiceId(null)
    setServiceDraft(emptyService)
  }

  async function saveService(event: FormEvent) {
    event.preventDefault()
    setServiceSaving(true)
    setServiceMessage(null)

    try {
      const url = editingServiceId
        ? `/api/admin/businesses/${business.id}/services/${editingServiceId}`
        : `/api/admin/businesses/${business.id}/services`
      const response = await fetch(url, {
        method: editingServiceId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...serviceDraft,
          price: Number(serviceDraft.price),
          duration: Number(serviceDraft.duration),
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save service')
      }

      const saved = result.data.service as ServiceItem & { _count?: { appointments: number } }
      const normalized: ServiceItem = {
        ...saved,
        appointmentCount: saved._count?.appointments ?? saved.appointmentCount ?? 0,
      }

      setServices(current =>
        editingServiceId
          ? current.map(service => (service.id === editingServiceId ? normalized : service))
          : [...current, normalized]
      )
      setServiceMessage(editingServiceId ? 'Service updated.' : 'Service added.')
      resetServiceForm()
    } catch (error) {
      setServiceMessage(error instanceof Error ? error.message : 'Failed to save service')
    } finally {
      setServiceSaving(false)
    }
  }

  async function deleteService(service: ServiceItem) {
    if (!confirm(`Delete “${service.name}”? Services with appointment history cannot be deleted.`)) {
      return
    }

    setServiceMessage(null)
    const response = await fetch(`/api/admin/businesses/${business.id}/services/${service.id}`, {
      method: 'DELETE',
    })
    const result = await response.json()

    if (!response.ok || !result.success) {
      setServiceMessage(result.error || 'Failed to delete service')
      return
    }

    setServices(current => current.filter(item => item.id !== service.id))
    setServiceMessage('Service deleted.')
    if (editingServiceId === service.id) resetServiceForm()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/admin" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← All businesses
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{business.name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Owner: {business.ownerEmail} · onprez.com/{business.slug}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/businesses/${business.id}/presence`}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Edit presence page
          </Link>
          {pageStatus.isPublished ? (
            <Link
              href={`/${business.slug}`}
              target="_blank"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              View live page
            </Link>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Presence</p>
          <p className="mt-2 text-lg font-semibold">{pageStatus.isPublished ? 'Published' : 'Draft'}</p>
          <p className="mt-1 text-xs text-slate-500">
            {pageStatus.updatedAt ? `Updated ${new Date(pageStatus.updatedAt).toLocaleDateString()}` : 'No page found'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services</p>
          <p className="mt-2 text-lg font-semibold">{services.length}</p>
          <p className="mt-1 text-xs text-slate-500">{services.filter(service => service.active).length} active</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
          <p className="mt-2 text-lg font-semibold">{business.isActive ? 'Active' : 'Inactive'}</p>
          <p className="mt-1 text-xs text-slate-500">{business.category}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Business profile content</h2>
          <p className="mt-1 text-sm text-slate-500">These details feed contact, SEO, trust, and presence-page content.</p>
        </div>
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business name" value={business.name} onChange={value => updateBusiness('name', value)} />
            <Field label="Tagline" value={business.tagline || ''} onChange={value => updateBusiness('tagline', value)} />
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              value={business.description || ''}
              onChange={event => updateBusiness('description', event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none ring-blue-500 focus:ring-2"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Public email" type="email" value={business.email || ''} onChange={value => updateBusiness('email', value)} />
            <Field label="Phone" value={business.phone || ''} onChange={value => updateBusiness('phone', value)} />
            <Field label="Website" value={business.website || ''} onChange={value => updateBusiness('website', value)} placeholder="https://" />
            <Field label="Country" value={business.country || ''} onChange={value => updateBusiness('country', value)} />
            <Field label="Address" value={business.address || ''} onChange={value => updateBusiness('address', value)} />
            <Field label="City" value={business.city || ''} onChange={value => updateBusiness('city', value)} />
            <Field label="County / state" value={business.state || ''} onChange={value => updateBusiness('state', value)} />
            <Field label="Postcode" value={business.zipCode || ''} onChange={value => updateBusiness('zipCode', value)} />
            <Field label="Logo image URL" value={business.logoUrl || ''} onChange={value => updateBusiness('logoUrl', value)} placeholder="https://" />
            <Field label="Cover image URL" value={business.coverImageUrl || ''} onChange={value => updateBusiness('coverImageUrl', value)} placeholder="https://" />
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={profileSaving}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
            {profileMessage ? <p className="text-sm text-slate-600">{profileMessage}</p> : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Services</h2>
            <p className="mt-1 text-sm text-slate-500">Add the customer’s real services, prices, durations, and images.</p>
          </div>
          {editingServiceId ? (
            <button onClick={resetServiceForm} className="text-sm font-medium text-blue-600">
              Cancel editing
            </button>
          ) : null}
        </div>

        <form onSubmit={saveService} className="rounded-2xl bg-slate-50 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Service name" value={serviceDraft.name} onChange={value => setServiceDraft(current => ({ ...current, name: value }))} />
            <Field label="Image URL" value={serviceDraft.imageUrl} onChange={value => setServiceDraft(current => ({ ...current, imageUrl: value }))} placeholder="https://" />
            <Field label="Price (£)" type="number" value={serviceDraft.price} onChange={value => setServiceDraft(current => ({ ...current, price: value }))} />
            <Field label="Duration (minutes)" type="number" value={serviceDraft.duration} onChange={value => setServiceDraft(current => ({ ...current, duration: value }))} />
          </div>
          <label className="mt-4 block space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              value={serviceDraft.description}
              onChange={event => setServiceDraft(current => ({ ...current, description: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none ring-blue-500 focus:ring-2"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={serviceDraft.active} onChange={event => setServiceDraft(current => ({ ...current, active: event.target.checked }))} />
              Active and bookable
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={serviceDraft.featured} onChange={event => setServiceDraft(current => ({ ...current, featured: event.target.checked }))} />
              Featured
            </label>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button disabled={serviceSaving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {serviceSaving ? 'Saving…' : editingServiceId ? 'Update service' : 'Add service'}
            </button>
            {serviceMessage ? <p className="text-sm text-slate-600">{serviceMessage}</p> : null}
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {services.map(service => (
            <div key={service.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{service.name}</h3>
                  {!service.active ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Hidden</span> : null}
                  {service.featured ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Featured</span> : null}
                </div>
                <p className="mt-1 text-sm text-slate-600">£{service.price.toFixed(2)} · {service.duration} minutes · {service.appointmentCount} appointments</p>
                {service.description ? <p className="mt-1 line-clamp-2 text-sm text-slate-500">{service.description}</p> : null}
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEditing(service)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">Edit</button>
                <button onClick={() => deleteService(service)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
          {services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
              No services yet. Add the first one above.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
