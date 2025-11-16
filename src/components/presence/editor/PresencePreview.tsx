/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { PageSection } from '@/types/page-sections'
import { SectionRenderer } from '../sections/SectionRenderer'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ThemeSettings {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  fontFamily?: string
  headingFont?: string
  buttonStyle?: 'rounded' | 'square' | 'pill'
  spacing?: 'compact' | 'normal' | 'relaxed'
}

interface PresencePreviewProps {
  sections: PageSection[]
  previewMode: 'desktop' | 'mobile'
  businessId: string | null
  businessSlug?: string | null
  themeVersion?: number
}

export function PresencePreview({
  sections,
  previewMode,
  businessId,
  businessSlug,
  themeVersion = 0,
}: PresencePreviewProps) {
  const [theme, setTheme] = useState<ThemeSettings>({})
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadTheme = useCallback(async () => {
    if (!businessId) return

    console.log('🎨 Loading theme, version:', themeVersion) // DEBUG
    setLoading(true)

    try {
      const response = await fetch(`/api/business/${businessId}?t=${Date.now()}`) // Cache bust
      const data = await response.json()

      console.log('📥 API Response:', data) // DEBUG
      if (data.success) {
        const settings = data.data.business.settings as any
        console.log('🔍 Full business data:', data.data.business) // DEBUG - see everything
        console.log('🔍 Settings object:', settings) // DEBUG - see settings
        console.log('🔍 Theme in settings:', settings?.theme) // DEBUG - see theme

        if (settings?.theme) {
          console.log('✅ Theme loaded:', settings.theme)
          setTheme(settings.theme)
        } else {
          console.log('⚠️ No theme in settings')
        }
      }

      if (data.success) {
        const settings = data.data.business.settings as any
        if (settings?.theme) {
          console.log('✅ Theme loaded:', settings.theme) // DEBUG
          setTheme(settings.theme)
        } else {
          console.log('⚠️ No theme in settings') // DEBUG
        }
      }
    } catch (error) {
      console.error('❌ Failed to load theme:', error)
    } finally {
      setLoading(false)
    }
  }, [businessId, themeVersion])

  useEffect(() => {
    loadTheme()
  }, [loadTheme])

  // Show refresh indicator when sections change
  useEffect(() => {
    setIsRefreshing(true)
    const timer = setTimeout(() => setIsRefreshing(false), 300)
    return () => clearTimeout(timer)
  }, [sections])

  const previewUrl = businessSlug ? `/${businessSlug}` : null

  return (
    <div className="relative h-full">
      {/* Preview Header */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${previewMode === 'desktop' ? 'bg-green-500' : 'bg-blue-500'}`}
              />
              <span className="text-sm font-medium text-gray-700">
                {previewMode === 'desktop' ? 'Desktop' : 'Mobile'} Preview
              </span>
            </div>

            {/* Refresh Indicator */}
            <AnimatePresence>
              {isRefreshing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 text-sm text-blue-600"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Preview URL */}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-onprez-blue hover:text-onprez-purple transition-colors"
            >
              <span className="hidden sm:inline">onprez.com{previewUrl}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Preview Container */}
      <div className="h-[calc(100%-60px)] overflow-auto bg-gray-100 p-4 sm:p-8">
        <motion.div
          key={`${previewMode}-${sections.length}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`
            bg-white rounded-lg shadow-xl mx-auto overflow-hidden transition-all duration-300
            ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-7xl'}
          `}
          style={{
            minHeight: previewMode === 'mobile' ? '667px' : '800px',
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-onprez-blue animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Loading preview...</p>
              </div>
            </div>
          ) : businessId ? (
            <ThemeProvider theme={theme} key={`theme-${themeVersion}-${JSON.stringify(theme)}`}>
              <div className="relative">
                {/* Theme indicator overlay (subtle) */}
                {Object.keys(theme).length > 0 && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
                      <div className="flex items-center gap-1">
                        {theme.primaryColor && (
                          <div
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                        )}
                        <span className="text-xs text-gray-600">Themed</span>
                      </div>
                    </div>

                    {/* DEBUG: Show theme values */}
                    <div className="mt-2 p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg text-xs">
                      <div>Primary: {theme.primaryColor}</div>
                      <div>Secondary: {theme.secondaryColor}</div>
                      <div>Font: {theme.fontFamily}</div>
                    </div>
                  </div>
                )}

                <SectionRenderer
                  sections={sections}
                  businessHandle="preview"
                  businessId={businessId}
                  businessName="Your Business"
                  businessData={{
                    phone: '+44 20 1234 5678',
                    email: 'hello@business.com',
                    address: '123 Business St, London',
                  }}
                  showInquiryForm={true}
                />
              </div>
            </ThemeProvider>
          ) : null}

          {/* Empty State */}
          {sections.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600">No sections yet</p>
                <p className="text-sm mt-2 text-gray-500">
                  Add sections from the left panel to build your presence page
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Preview Info Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">Preview updates automatically as you make changes</p>
        </div>
      </div>
    </div>
  )
}
