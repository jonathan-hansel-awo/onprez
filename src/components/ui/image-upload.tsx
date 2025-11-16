'use client'

import { SetStateAction, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { UploadButton, UploadDropzone } from '@/lib/utils/uploadthing'
import Image from 'next/image'

export interface ImageUploadProps {
  label?: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  aspect?: 'square' | 'landscape' | 'portrait'
  showRemoveButton?: boolean
  endpoint?: 'imageUploader' | 'galleryUploader'
}

export function ImageUpload({
  label,
  value,
  onChange,
  onRemove,
  aspect = 'landscape',
  showRemoveButton = true,
  endpoint = 'imageUploader',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const aspectClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[3/4]',
  }

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <div className={cn('relative w-full', aspectClasses[aspect])}>
        {value ? (
          // Preview existing image
          <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 group">
            <Image src={value} alt="Upload preview" fill className="object-cover" />

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <UploadButton
                endpoint={endpoint}
                onClientUploadComplete={(res: { url: string }[]) => {
                  if (res?.[0]?.url) {
                    onChange(res[0].url)
                    setUploading(false)
                  }
                }}
                onUploadError={(error: Error) => {
                  console.error('Upload error:', error)
                  alert(`Upload failed: ${error.message}`)
                  setUploading(false)
                }}
                onUploadBegin={() => {
                  setUploading(true)
                }}
                appearance={{
                  button:
                    'px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium cursor-pointer',
                  allowedContent: 'hidden',
                }}
                content={{
                  button: uploading ? 'Uploading...' : 'Change Image',
                }}
              />

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

            {/* Upload Progress Indicator */}
            {uploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                  <p className="text-white text-sm">
                    {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploading...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload dropzone
          <div className="w-full h-full">
            <UploadDropzone
              endpoint={endpoint}
              onClientUploadComplete={(res: { url: string }[]) => {
                if (res?.[0]?.url) {
                  onChange(res[0].url)
                  setUploading(false)
                  setUploadProgress(0)
                }
              }}
              onUploadError={(error: Error) => {
                console.error('Upload error:', error)
                alert(`Upload failed: ${error.message}`)
                setUploading(false)
                setUploadProgress(0)
              }}
              onUploadBegin={() => {
                setUploading(true)
                setUploadProgress(0)
              }}
              onUploadProgress={(progress: SetStateAction<number>) => {
                setUploadProgress(progress)
              }}
              appearance={{
                container:
                  'w-full h-full border-2 border-dashed border-gray-300 rounded-lg hover:border-onprez-blue transition-colors cursor-pointer ut-uploading:border-onprez-blue ut-uploading:bg-onprez-blue/5',
                uploadIcon: 'text-gray-400 w-10 h-10',
                label: 'text-sm text-gray-600 font-medium',
                allowedContent: 'text-xs text-gray-400 mt-1',
                button:
                  'bg-onprez-blue text-white px-4 py-2 rounded-lg hover:bg-onprez-blue/90 transition-colors text-sm font-medium cursor-pointer ut-ready:bg-onprez-blue ut-uploading:cursor-not-allowed ut-uploading:bg-gray-400 ut-uploading:text-gray-200',
              }}
              content={{
                label: uploading
                  ? uploadProgress > 0
                    ? `Uploading... ${uploadProgress}%`
                    : 'Uploading...'
                  : 'Click or drag and drop',
                allowedContent: 'PNG, JPG, WebP (max 4MB)',
                button: uploading ? `${uploadProgress}%` : 'Choose File',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
