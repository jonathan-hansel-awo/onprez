'use client'

import { GallerySection as GallerySectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import {
  getAccentColor,
  getContentWidth,
  getSectionSpacing,
  getSectionStyle,
} from './section-style'

interface GallerySectionProps {
  section: GallerySectionType
}

const gridCols = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}

const gapClasses = {
  tight: 'gap-1',
  normal: 'gap-4',
  wide: 'gap-8',
}

const radiusClasses = {
  none: 'rounded-none',
  soft: 'rounded-lg',
  rounded: 'rounded-3xl',
}

export function GallerySection({ section }: GallerySectionProps) {
  const {
    title,
    eyebrow,
    images,
    layout = 'grid',
    columns = 3,
    featuredImageIndex = 0,
    gap = 'normal',
    imageRadius = layout === 'editorial' ? 'none' : 'soft',
  } = section.data

  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const accentColor = getAccentColor(section.appearance)

  if (images.length === 0) return null

  function nextImage() {
    if (selectedImage === null) return
    setSelectedImage((selectedImage + 1) % images.length)
  }

  function prevImage() {
    if (selectedImage === null) return
    setSelectedImage((selectedImage - 1 + images.length) % images.length)
  }

  const heading = (alignment: 'left' | 'center' = 'center') =>
    title || eyebrow ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={cn('mb-12', alignment === 'center' ? 'text-center' : 'text-left')}
      >
        {eyebrow && (
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: accentColor }}
          >
            {eyebrow}
          </p>
        )}
        {title && (
          <h2
            className={cn(
              'font-bold leading-[1.02] tracking-[-0.025em] theme-heading',
              layout === 'editorial' ? 'text-5xl sm:text-6xl lg:text-7xl' : 'text-3xl md:text-4xl'
            )}
            style={{ fontFamily: 'var(--theme-font-heading)', color: 'inherit' }}
          >
            {title}
          </h2>
        )}
      </motion.div>
    ) : null

  const lightbox = selectedImage !== null && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={() => setSelectedImage(null)}
      role="dialog"
      aria-modal="true"
      aria-label="Gallery image viewer"
    >
      <button
        onClick={() => setSelectedImage(null)}
        className="absolute right-4 top-4 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
        aria-label="Close image viewer"
      >
        <X className="h-8 w-8" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={event => {
              event.stopPropagation()
              prevImage()
            }}
            className="absolute left-4 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-3 transition-colors hover:bg-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={event => {
              event.stopPropagation()
              nextImage()
            }}
            className="absolute right-4 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-3 transition-colors hover:bg-white/20"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      <div className="relative h-full max-h-[90vh] w-full max-w-5xl">
        <Image
          src={images[selectedImage].url}
          alt={images[selectedImage].alt}
          fill
          sizes="100vw"
          className="object-contain"
          onClick={event => event.stopPropagation()}
        />
      </div>

      {images[selectedImage].caption && (
        <div className="absolute bottom-8 left-1/2 max-w-2xl -translate-x-1/2 rounded-lg bg-black/70 px-6 py-3 text-white">
          <p className="text-center">{images[selectedImage].caption}</p>
        </div>
      )}

      <div className="absolute left-4 top-4 rounded-lg bg-black/70 px-4 py-2 text-white">
        {selectedImage + 1} / {images.length}
      </div>
    </div>
  )

  if (layout === 'carousel') {
    return (
      <section
        id={section.id}
        className={getSectionSpacing(section.appearance)}
        style={getSectionStyle(section.appearance, '#FFFFFF', '#111827')}
      >
        <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}>
          {heading('center')}

          <div className="relative mx-auto max-w-4xl">
            <div
              className={cn(
                'relative aspect-[16/9] overflow-hidden bg-black/5',
                radiusClasses[imageRadius]
              )}
            >
              <Image
                src={images[currentIndex].url}
                alt={images[currentIndex].alt}
                fill
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-cover"
              />
              {images[currentIndex].caption && (
                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-4 text-white">
                  <p className="text-center">{images[currentIndex].caption}</p>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentIndex((currentIndex - 1 + images.length) % images.length)
                  }
                  className="absolute left-4 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-3 shadow-lg transition-colors hover:bg-white"
                  aria-label="Previous gallery image"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-900" />
                </button>
                <button
                  onClick={() => setCurrentIndex((currentIndex + 1) % images.length)}
                  className="absolute right-4 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-3 shadow-lg transition-colors hover:bg-white"
                  aria-label="Next gallery image"
                >
                  <ChevronRight className="h-6 w-6 text-gray-900" />
                </button>
              </>
            )}

            {images.length > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {images.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'h-3 rounded-full transition-all',
                      index === currentIndex ? 'w-8' : 'w-3 bg-black/20'
                    )}
                    style={index === currentIndex ? { backgroundColor: accentColor } : undefined}
                    aria-label={`Show gallery image ${index + 1}`}
                    aria-current={index === currentIndex}
                  />
                ))}
              </div>
            )}
          </div>
          {lightbox}
        </div>
      </section>
    )
  }

  if (layout === 'editorial') {
    const safeFeaturedIndex = Math.min(Math.max(featuredImageIndex, 0), images.length - 1)
    const orderedImages = [
      { image: images[safeFeaturedIndex], originalIndex: safeFeaturedIndex },
      ...images
        .map((image, originalIndex) => ({ image, originalIndex }))
        .filter(entry => entry.originalIndex !== safeFeaturedIndex),
    ]

    return (
      <section
        id={section.id}
        className={getSectionSpacing(section.appearance)}
        style={getSectionStyle(section.appearance, '#111513', '#F8F4ED')}
      >
        <div
          className={cn(
            'mx-auto px-4 sm:px-6 lg:px-8',
            getContentWidth({
              ...section.appearance,
              contentWidth: section.appearance?.contentWidth || 'wide',
            })
          )}
        >
          {heading('left')}

          <div className={cn('grid grid-cols-1 md:grid-cols-12', gapClasses[gap])}>
            {orderedImages.map(({ image, originalIndex }, index) => (
              <motion.button
                key={`${image.url}-${originalIndex}`}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.06, 0.3) }}
                onClick={() => setSelectedImage(originalIndex)}
                className={cn(
                  'group relative overflow-hidden bg-white/5 text-left',
                  radiusClasses[imageRadius],
                  index === 0
                    ? 'aspect-[4/5] md:col-span-7 md:row-span-2 md:min-h-[680px] md:aspect-auto'
                    : index <= 2
                      ? 'aspect-[4/3] md:col-span-5'
                      : 'aspect-[4/3] md:col-span-6'
                )}
                aria-label={`Open ${image.alt || `gallery image ${originalIndex + 1}`}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes={
                    index === 0
                      ? '(min-width: 768px) 58vw, 100vw'
                      : '(min-width: 768px) 42vw, 100vw'
                  }
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {image.caption && (
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/80 to-transparent p-5 pt-14 text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    <p className="text-sm">{image.caption}</p>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          {lightbox}
        </div>
      </section>
    )
  }

  return (
    <section
      id={section.id}
      className={getSectionSpacing(section.appearance)}
      style={getSectionStyle(section.appearance, '#FFFFFF', '#111827')}
    >
      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', getContentWidth(section.appearance))}>
        {heading('center')}

        <div
          className={cn(
            'grid grid-cols-1',
            gridCols[columns],
            gapClasses[gap],
            layout === 'masonry' && 'auto-rows-[180px]'
          )}
        >
          {images.map((image, index) => (
            <motion.button
              key={`${image.url}-${index}`}
              type="button"
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.05, 0.25) }}
              onClick={() => setSelectedImage(index)}
              className={cn(
                'group relative cursor-pointer overflow-hidden bg-black/5 text-left',
                radiusClasses[imageRadius],
                layout === 'masonry'
                  ? index % 5 === 0
                    ? 'row-span-2 min-h-[360px]'
                    : 'row-span-1 min-h-[180px]'
                  : 'aspect-square'
              )}
              aria-label={`Open ${image.alt || `gallery image ${index + 1}`}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes={`(min-width: 768px) ${Math.round(100 / columns)}vw, 100vw`}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {image.caption && (
                <div className="absolute inset-0 flex items-end bg-black/60 p-4 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <p className="text-sm">{image.caption}</p>
                </div>
              )}
            </motion.button>
          ))}
        </div>
        {lightbox}
      </div>
    </section>
  )
}
