'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

export function ValueCalculator() {
  const [clients, setClients] = useState(10)
  const [price, setPrice] = useState(100)

  const monthlyRevenue = clients * price
  const onprezCost = 29
  const hoursBack = clients * 0.5 // Assume 30 min saved per booking

  const paybackHours = onprezCost / (price / 2) // Assuming $50/hour rate
  const roi = (((monthlyRevenue - onprezCost) / onprezCost) * 100).toFixed(0)

  return (
    <motion.div
      className="max-w-2xl mx-auto my-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-onprez-blue/20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Value Calculator</h3>
        <p className="text-gray-600">See how quickly OnPrez pays for itself</p>
      </div>

      {/* Inputs */}
      <div className="space-y-6 mb-8">
        {/* Clients Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">Bookings per month</label>
            <span className="text-2xl font-bold text-onprez-blue">{clients}</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={clients}
            onChange={e => setClients(Number(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-onprez-blue"
          />
        </div>

        {/* Price Input */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">Average booking price</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">$</span>
              <input
                type="number"
                min="10"
                max="1000"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg text-center font-bold text-onprez-blue focus:border-onprez-blue focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <motion.div
        className="bg-white rounded-xl p-6 shadow-lg"
        key={`${clients}-${price}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid md:grid-cols-3 gap-6 text-center">
          {/* Monthly Revenue */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Monthly Revenue</p>
            <p className="text-3xl font-bold text-gray-900">${monthlyRevenue.toLocaleString()}</p>
          </div>

          {/* Time Saved */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Hours Saved</p>
            <p className="text-3xl font-bold text-onprez-green">{hoursBack.toFixed(1)}h</p>
          </div>

          {/* ROI */}
          <div>
            <p className="text-sm text-gray-600 mb-2">ROI</p>
            <p className="text-3xl font-bold text-onprez-purple">{roi}%</p>
          </div>
        </div>

        {/* Payback Message */}
        <motion.div
          className="mt-6 pt-6 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-3 text-center">
            <TrendingUp className="w-6 h-6 text-onprez-green" />
            <p className="text-gray-700">
              <strong className="text-onprez-blue">OnPrez pays for itself</strong> in just{' '}
              <strong className="text-onprez-purple">{paybackHours.toFixed(1)} hours</strong> of
              work
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
