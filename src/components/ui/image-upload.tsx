'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Image from 'next/image'
import { ActionFeedback } from './action-feedback'

export interface ImageUploadProps {
  businessId: string | null
  purpose: 'business-logo' | 'business-cover' | 'service' | 'gallery'
  label?: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  aspect?: 'square' | 'landscape' | 'portrait'
  maxSize?: number // MB
  showRemoveButton?: boolean
}

export function ImageUpload({
  businessId,
  purpose,
  label,
  value,
  onChange,
  onRemove,
  aspect = 'landscape',
  maxSize = 4,
  showRemoveButton = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploaded, setUploaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadInProgressRef = useRef(false)

  const aspectClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadInProgressRef.current) return

    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    const effectiveMaxSize = Math.min(maxSize, 4)

    if (file.size > effectiveMaxSize * 1024 * 1024) {
      setError(`File size must be less than ${effectiveMaxSize}MB`)
      return
    }

    if (!businessId) {
      setError('Business context is unavailable. Please refresh and try again.')
      return
    }

    setError('')
    setUploaded(false)
    setUploading(true)
    uploadInProgressRef.current = true

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('businessId', businessId)
      formData.append('purpose', purpose)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        onChange(data.data.url)
        setUploaded(true)
      } else {
        setError(data.error || 'The image could not be uploaded. Check the file and try again.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('The upload was interrupted. Check your connection and try again.')
    } finally {
      setUploading(false)
      uploadInProgressRef.current = false
      e.target.value = ''
    }
  }

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <div className={cn('relative w-full', aspectClasses[aspect])}>
        {value ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 group">
            <Image src={value} alt="Upload preview" fill className="object-cover" unoptimized />

            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="min-h-11 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
                disabled={uploading}
              >
                Change
              </button>

              {showRemoveButton && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="min-h-11 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                  disabled={uploading}
                >
                  Remove
                </button>
              )}
            </div>

            {uploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className={cn(
              'w-full h-full border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              'flex flex-col items-center justify-center gap-2',
              uploading
                ? 'border-onprez-blue bg-onprez-blue/5'
                : 'border-gray-300 hover:border-onprez-blue'
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-onprez-blue animate-spin" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload</p>
                <p className="text-xs text-gray-400">
                  PNG, JPG, WebP (max {Math.min(maxSize, 4)}MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {uploaded && (
        <ActionFeedback
          status="success"
          title="Image uploaded"
          message="The new image is ready. Save your changes to publish it."
          className="mt-3"
        />
      )}

      {error && (
        <ActionFeedback
          status="error"
          title="Upload unsuccessful"
          message={error}
          actionLabel="Choose another image"
          onAction={() => inputRef.current?.click()}
          className="mt-3"
        />
      )}
    </div>
  )
}
