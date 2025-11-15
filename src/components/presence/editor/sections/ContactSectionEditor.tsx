/* eslint-disable react/no-unescaped-entities */
'use client'

import { ContactSection } from '@/types/page-sections'
import { Input } from '@/components/form/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/form/label'
import { Toggle } from '@/components/ui/toggle'
import { useState, useEffect } from 'react'
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Globe } from 'lucide-react'

interface ContactSectionEditorProps {
  section: ContactSection
  onUpdate: (section: ContactSection) => void
  businessId: string | null
}

interface BusinessContactData {
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

export function ContactSectionEditor({ section, onUpdate, businessId }: ContactSectionEditorProps) {
  const [businessData, setBusinessData] = useState<BusinessContactData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (businessId) {
      fetchBusinessData()
    }
  }, [businessId])

  async function fetchBusinessData() {
    try {
      const response = await fetch(`/api/business/${businessId}`)
      const data = await response.json()

      if (data.success) {
        setBusinessData(data.data.business)
      }
    } catch (error) {
      console.error('Failed to fetch business data:', error)
    } finally {
      setLoading(false)
    }
  }

  function updateData<K extends keyof ContactSection['data']>(
    field: K,
    value: ContactSection['data'][K]
  ) {
    onUpdate({
      ...section,
      data: {
        ...section.data,
        [field]: value,
      },
    })
  }

  const fullAddress = businessData
    ? [businessData.address, businessData.city, businessData.zipCode].filter(Boolean).join(', ')
    : ''

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Settings</h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="contact-title">Section Title *</Label>
            <Input
              id="contact-title"
              value={section.data.title}
              onChange={e => updateData('title', e.target.value)}
              placeholder="e.g., Get in Touch, Contact Us"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Contact Information Display Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-onprez-blue mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Phone */}
            <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                <Phone className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Label>Phone Number</Label>
                  {businessData?.phone ? (
                    <p className="text-sm text-gray-900 mt-1">{businessData.phone}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic mt-1">
                      Not set - Add in Business Settings
                    </p>
                  )}
                </div>
              </div>
              <Toggle
                checked={section.data.showPhone ?? true}
                onChange={checked => updateData('showPhone', checked)}
                disabled={!businessData?.phone}
              />
            </div>

            {/* Email */}
            <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                <Mail className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Label>Email Address</Label>
                  {businessData?.email ? (
                    <p className="text-sm text-gray-900 mt-1">{businessData.email}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic mt-1">
                      Not set - Add in Business Settings
                    </p>
                  )}
                </div>
              </div>
              <Toggle
                checked={section.data.showEmail ?? true}
                onChange={checked => updateData('showEmail', checked)}
                disabled={!businessData?.email}
              />
            </div>

            {/* Address */}
            <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Label>Physical Address</Label>
                  {fullAddress ? (
                    <p className="text-sm text-gray-900 mt-1">{fullAddress}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic mt-1">
                      Not set - Add in Business Settings
                    </p>
                  )}
                </div>
              </div>
              <Toggle
                checked={section.data.showAddress ?? true}
                onChange={checked => updateData('showAddress', checked)}
                disabled={!fullAddress}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Map Integration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Map Integration</h3>

        <div className="space-y-4">
          {/* Show Map Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Map</Label>
              <p className="text-sm text-gray-500">Display an embedded map of your location</p>
            </div>
            <Toggle
              checked={section.data.showMap ?? false}
              onChange={checked => updateData('showMap', checked)}
            />
          </div>

          {/* Map Embed URL */}
          {section.data.showMap && (
            <div>
              <Label htmlFor="contact-map-url">Google Maps Embed URL</Label>
              <Input
                id="contact-map-url"
                value={section.data.mapEmbedUrl || ''}
                onChange={e => updateData('mapEmbedUrl', e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="mt-1 font-mono text-xs"
              />
              <details className="mt-2 text-xs text-gray-600">
                <summary className="cursor-pointer hover:text-gray-900">
                  How to get the embed URL?
                </summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>Go to Google Maps and search for your location</li>
                  <li>Click on "Share" button</li>
                  <li>Click on "Embed a map" tab</li>
                  <li>Copy the URL from the iframe src attribute</li>
                  <li>Paste it here</li>
                </ol>
              </details>
            </div>
          )}
        </div>
      </Card>

      {/* Social Media Links */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>

        <div className="space-y-4">
          {/* Show Social Media Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label>Show Social Media Links</Label>
              <p className="text-sm text-gray-500">Display your social media profiles</p>
            </div>
            <Toggle
              checked={section.data.showSocialMedia ?? true}
              onChange={checked => updateData('showSocialMedia', checked)}
            />
          </div>

          {section.data.showSocialMedia && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">
                Social media links from your business profile:
              </p>

              {/* Facebook */}
              <div className="flex items-center gap-3">
                <Facebook className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <Label className="text-xs">Facebook</Label>
                  {businessData?.socialLinks?.facebook ? (
                    <p className="text-xs text-gray-900 truncate">
                      {businessData.socialLinks.facebook}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Not set</p>
                  )}
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-pink-600 flex-shrink-0" />
                <div className="flex-1">
                  <Label className="text-xs">Instagram</Label>
                  {businessData?.socialLinks?.instagram ? (
                    <p className="text-xs text-gray-900 truncate">
                      {businessData.socialLinks.instagram}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Not set</p>
                  )}
                </div>
              </div>

              {/* Twitter */}
              <div className="flex items-center gap-3">
                <Twitter className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <Label className="text-xs">Twitter / X</Label>
                  {businessData?.socialLinks?.twitter ? (
                    <p className="text-xs text-gray-900 truncate">
                      {businessData.socialLinks.twitter}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Not set</p>
                  )}
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5 text-blue-700 flex-shrink-0" />
                <div className="flex-1">
                  <Label className="text-xs">LinkedIn</Label>
                  {businessData?.socialLinks?.linkedin ? (
                    <p className="text-xs text-gray-900 truncate">
                      {businessData.socialLinks.linkedin}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Not set</p>
                  )}
                </div>
              </div>

              {/* Website */}
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <Label className="text-xs">Website</Label>
                  {businessData?.socialLinks?.website ? (
                    <p className="text-xs text-gray-900 truncate">
                      {businessData.socialLinks.website}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Not set</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  💡 Update social links in your Business Settings
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Contact information is pulled from your Business Settings. Update
          it there to see changes here.
        </p>
      </div>
    </div>
  )
}
