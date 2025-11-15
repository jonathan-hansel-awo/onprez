'use client'

import { GallerySection as GallerySectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'

interface GallerySectionProps {
  section: GallerySectionType
}

export function GallerySection({ section }: GallerySectionProps) {
  const { title, images, layout, columns } = section.data
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }

  if (images.length === 0) return null

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {title && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
          </motion.div>
        )}

        {/* Gallery Grid */}
        <div className={`grid grid-cols-1 ${gridCols[columns || 3]} gap-4`}>
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedImage(index)}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-lg group"
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {image.caption && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-white text-sm">{image.caption}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedImage !== null && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
              <Image
                src={images[selectedImage].url}
                alt={images[selectedImage].alt}
                fill
                className="object-contain"
              />
            </div>

            {images[selectedImage].caption && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-lg max-w-2xl">
                <p className="text-center">{images[selectedImage].caption}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
