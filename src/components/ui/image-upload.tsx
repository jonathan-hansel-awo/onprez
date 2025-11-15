'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ImageUploadProps {
  label?: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  aspect?: 'square' | 'landscape' | 'portrait'
  maxSize?: number // MB
  showRemoveButton?: boolean
}

export function ImageUpload({
  label,
  value,
  onChange,
  onRemove,
  aspect = 'landscape',
  maxSize = 5,
  showRemoveButton = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const aspectClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }

  const handleFile = async (file: File) => {
    setError('')

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setUploading(true)

    try {
      // TODO: Implement actual upload to storage (e.g., Cloudflare R2, AWS S3)
      // For now, create a local preview URL
      const url = URL.createObjectURL(file)
      onChange(url)

      // Simulated upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <div className={cn('relative w-full', aspectClasses[aspect])}>
        {value ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200">
            <img src={value} alt="Upload preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Change
              </button>
              {showRemoveButton && value && (
                <button
                  onClick={onRemove}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            onDragOver={e => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'w-full h-full border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              'flex flex-col items-center justify-center gap-2',
              dragActive
                ? 'border-onprez-blue bg-onprez-blue/5'
                : 'border-gray-300 hover:border-onprez-blue'
            )}
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-onprez-blue animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">Drop image or click to upload</p>
                <p className="text-xs text-gray-400">Max {maxSize}MB</p>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
