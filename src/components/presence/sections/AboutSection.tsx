'use client'

import { AboutSection as AboutSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface AboutSectionProps {
  section: AboutSectionType
}

export function AboutSection({ section }: AboutSectionProps) {
  const { title, content, image, imagePosition } = section.data
  const isImageLeft = imagePosition === 'left'

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid md:grid-cols-2 gap-12 items-center ${
            isImageLeft ? 'md:grid-flow-col-dense' : ''
          }`}
        >
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={isImageLeft ? 'md:col-start-2' : ''}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{title}</h2>
            <div
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </motion.div>

          {/* Image */}
          {image && (
            <motion.div
              initial={{ opacity: 0, x: isImageLeft ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl ${
                isImageLeft ? 'md:col-start-1 md:row-start-1' : ''
              }`}
            >
              <Image src={image} alt={title} fill className="object-cover" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
