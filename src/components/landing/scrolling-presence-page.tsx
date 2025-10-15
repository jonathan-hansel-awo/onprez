'use client'

import { motion } from 'framer-motion'
import { Check, Star, Calendar } from 'lucide-react'

interface ScrollingPresencePageProps {
  scrollProgress: number
}

export function ScrollingPresencePage({ scrollProgress }: ScrollingPresencePageProps) {
  return (
    <motion.div
      className="relative w-full"
      animate={{ y: -scrollProgress * 1400 }} // Increased for more content
      transition={{ duration: 0.3 }}
    >
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg">
            💆
          </div>
          <div>
            <h2 className="text-lg font-bold">Emma&apos;s Massage</h2>
            <p className="text-white/90 text-xs">Therapeutic Wellness</p>
          </div>
        </div>
        <p className="text-white/90 text-xs leading-relaxed">
          Transform your body and mind with expert therapeutic massage
        </p>
      </div>

      {/* About Section */}
      <div className="p-5 bg-white">
        <h3 className="text-sm font-bold text-gray-900 mb-2">About Me</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          With 10+ years of experience, I specialize in deep tissue, Swedish, and sports massage. My
          goal is to help you achieve optimal wellness and relaxation.
        </p>
      </div>

      {/* Gallery Section */}
      <div className="p-5 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Gallery</h3>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg overflow-hidden"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(${240 + i * 15}, 70%, 60%), 
                  hsl(${260 + i * 15}, 70%, 70%))`,
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white text-xl">
                {['🧘', '💆', '🌿', '✨'][i]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Section */}
      <div className="p-5 bg-white">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Services</h3>
        <div className="space-y-2">
          {[
            { name: 'Deep Tissue Massage', price: '£70', duration: '60 min' },
            { name: 'Swedish Massage', price: '£60', duration: '60 min' },
            { name: 'Sports Massage', price: '£75', duration: '60 min' },
          ].map((service, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
            >
              <div>
                <p className="font-semibold text-gray-900 text-xs">{service.name}</p>
                <p className="text-[10px] text-gray-600">{service.duration}</p>
              </div>
              <div className="text-sm font-bold text-onprez-blue">{service.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="p-5 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900 mb-3">What Clients Say</h3>
        <div className="space-y-2">
          {[
            { name: 'Sarah M.', text: "Emma is amazing! Best massage I've ever had." },
            { name: 'Mike T.', text: 'Helped relieve my chronic back pain. Highly recommend!' },
          ].map((testimonial, i) => (
            <div key={i} className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">{testimonial.name}</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-600">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Section */}
      <div className="p-5 bg-white">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Book Your Session</h3>
        <div className="bg-gradient-to-r from-onprez-blue to-onprez-purple p-4 rounded-xl text-white text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs font-semibold mb-3">Choose Your Time</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {['10 AM', '2 PM', '4 PM'].map(time => (
              <button
                key={time}
                className="bg-white/20 hover:bg-white/30 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
              >
                {time}
              </button>
            ))}
          </div>
          <button className="w-full bg-white text-onprez-blue py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
            Book Now
          </button>
        </div>
      </div>

      {/* Confirmation */}
      <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="bg-white p-4 rounded-xl shadow-lg text-center">
          <motion.div
            className="w-12 h-12 bg-onprez-green rounded-full flex items-center justify-center mx-auto mb-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Check className="w-7 h-7 text-white" />
          </motion.div>
          <h4 className="text-base font-bold text-gray-900 mb-1">Booking Confirmed!</h4>
          <p className="text-xs text-gray-600">See you tomorrow at 2 PM</p>
        </div>
      </div>
    </motion.div>
  )
}
