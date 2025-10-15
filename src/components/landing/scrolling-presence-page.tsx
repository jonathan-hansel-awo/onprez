'use client'

import { motion } from 'framer-motion'
import { Check, Star, Calendar } from 'lucide-react'

interface ScrollingPresencePageProps {
  scrollProgress: number
}

export function ScrollingPresencePage({ scrollProgress }: ScrollingPresencePageProps) {
  return (
    <div className="relative w-full max-w-sm mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
      {/* Scrollable Content Container */}
      <motion.div
        className="relative"
        animate={{ y: -scrollProgress * 800 }}
        transition={{ duration: 0.3 }}
      >
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl">
              💆
            </div>
            <div>
              <h2 className="text-2xl font-bold">Emma&apos;s Massage</h2>
              <p className="text-white/90">Therapeutic Wellness</p>
            </div>
          </div>
          <p className="text-white/90 text-sm">
            Transform your body and mind with expert therapeutic massage
          </p>
        </div>

        {/* About Section */}
        <div className="p-6 bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-3">About Me</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            With 10+ years of experience, I specialize in deep tissue, Swedish, and sports massage.
            My goal is to help you achieve optimal wellness and relaxation.
          </p>
        </div>

        {/* Gallery Section */}
        <div className="p-6 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Gallery</h3>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="aspect-square rounded-lg overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(${240 + i * 15}, 70%, 60%), 
                    hsl(${260 + i * 15}, 70%, 70%))`,
                }}
              >
                <div className="w-full h-full flex items-center justify-center text-white text-2xl">
                  {['🧘', '💆', '🌿', '✨'][i]}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Services Section */}
        <div className="p-6 bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Services</h3>
          <div className="space-y-3">
            {[
              { name: 'Deep Tissue Massage', price: '$90', duration: '60 min' },
              { name: 'Swedish Massage', price: '$80', duration: '60 min' },
              { name: 'Sports Massage', price: '$95', duration: '60 min' },
            ].map((service, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                  <p className="text-xs text-gray-600">{service.duration}</p>
                </div>
                <div className="text-lg font-bold text-onprez-blue">{service.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="p-6 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">What Clients Say</h3>
          <div className="space-y-3">
            {[
              { name: 'Sarah M.', text: "Emma is amazing! Best massage I've ever had." },
              { name: 'Mike T.', text: 'Helped relieve my chronic back pain. Highly recommend!' },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Section */}
        <div className="p-6 bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Book Your Session</h3>
          <div className="bg-gradient-to-r from-onprez-blue to-onprez-purple p-6 rounded-xl text-white text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3" />
            <p className="font-semibold mb-4">Choose Your Time</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['10 AM', '2 PM', '4 PM'].map(time => (
                <button
                  key={time}
                  className="bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {time}
                </button>
              ))}
            </div>
            <button className="w-full bg-white text-onprez-blue py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              Book Now
            </button>
          </div>
        </div>

        {/* Confirmation */}
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <motion.div
              className="w-16 h-16 bg-onprez-green rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h4>
            <p className="text-sm text-gray-600">See you tomorrow at 2 PM</p>
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-24 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="w-full bg-onprez-blue rounded-full"
          style={{ height: `${scrollProgress * 100}%` }}
        />
      </div>
    </div>
  )
}
