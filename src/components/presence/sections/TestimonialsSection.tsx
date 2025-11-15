'use client'

import { TestimonialsSection as TestimonialsSectionType } from '@/types/page-sections'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

interface TestimonialsSectionProps {
  section: TestimonialsSectionType
}

export function TestimonialsSection({ section }: TestimonialsSectionProps) {
  const { title, testimonials, layout } = section.data
  const [activeIndex, setActiveIndex] = useState(0)

  if (testimonials.length === 0) return null

  const isCarousel = layout === 'carousel'

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-onprez-blue/5 to-onprez-purple/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
        </motion.div>

        {/* Testimonials */}
        {isCarousel ? (
          <div className="max-w-4xl mx-auto">
            {/* Carousel */}
            <div className="relative">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
              >
                <Quote className="w-12 h-12 text-onprez-blue/20 mb-6" />

                <p className="text-lg md:text-xl text-gray-700 mb-8 italic">
                  &ldquo;{testimonials[activeIndex].content}&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  {testimonials[activeIndex].image && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden">
                      <Image
                        src={testimonials[activeIndex].image!}
                        alt={testimonials[activeIndex].name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-gray-900">{testimonials[activeIndex].name}</p>
                    {testimonials[activeIndex].role && (
                      <p className="text-sm text-gray-600">{testimonials[activeIndex].role}</p>
                    )}

                    {testimonials[activeIndex].rating && (
                      <div className="flex gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimonials[activeIndex].rating!
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === activeIndex ? 'bg-onprez-blue w-8' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <Quote className="w-8 h-8 text-onprez-blue/20 mb-4" />

                <p className="text-gray-700 mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>

                <div className="flex items-center gap-3">
                  {testimonial.image && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    {testimonial.role && (
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    )}

                    {testimonial.rating && (
                      <div className="flex gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < testimonial.rating!
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
