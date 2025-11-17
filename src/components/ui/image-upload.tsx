'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Image from 'next/image'

export interface ImageUploadProps {
  label?: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  aspect?: 'square' | 'landscape' | 'portrait'
  showRemoveButton?: boolean
}

export function ImageUpload({
  label,
  value,
  onChange,
  onRemove,
  aspect = 'landscape',
  showRemoveButton = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const aspectClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('File size must be less than 4MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        onChange(data.data.url)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <div className={cn('relative w-full', aspectClasses[aspect])}>
        {value ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 group">
            <Image src={value} alt="Upload preview" fill className="object-cover" />

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                disabled={uploading}
              >
                Change
              </button>

              {showRemoveButton && (
                <button
                  onClick={onRemove}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
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
                <p className="text-xs text-gray-400">PNG, JPG, WebP (max 4MB)</p>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
