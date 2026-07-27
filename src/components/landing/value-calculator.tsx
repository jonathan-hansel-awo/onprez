'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

export function ValueCalculator() {
  const [clients, setClients] = useState(10)
  const [price, setPrice] = useState(100)

  const monthlyRevenue = clients * price
  const onprezCost = 8
  const hoursBack = clients * 0.5
  const paybackHours = onprezCost / Math.max(price / 2, 1)
  const netBookingValue = Math.max(monthlyRevenue - onprezCost, 0)

  return (
    <motion.div
      className="mx-auto my-16 max-w-2xl rounded-2xl border-2 border-onprez-blue/20 bg-gradient-to-br from-blue-50 to-purple-50 p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-8 text-center">
        <h3 className="mb-2 text-2xl font-bold text-gray-900">Professional plan value</h3>
        <p className="text-gray-600">
          Compare the £8 monthly plan with your estimated bookings.
        </p>
      </div>

      <div className="mb-8 space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor="monthly-bookings" className="text-sm font-semibold text-gray-700">
              Bookings per month
            </label>
            <span className="text-2xl font-bold text-onprez-blue">{clients}</span>
          </div>
          <input
            id="monthly-bookings"
            type="range"
            min="1"
            max="100"
            value={clients}
            onChange={event => setClients(Number(event.target.value))}
            className="h-3 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-onprez-blue"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <label
              htmlFor="average-booking-price"
              className="text-sm font-semibold text-gray-700"
            >
              Average booking value
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">£</span>
              <input
                id="average-booking-price"
                type="number"
                min="10"
                max="1000"
                value={price}
                onChange={event => setPrice(Number(event.target.value))}
                className="w-24 rounded-lg border-2 border-gray-200 px-3 py-2 text-center font-bold text-onprez-blue focus:border-onprez-blue focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="rounded-xl bg-white p-6 shadow-lg"
        key={`${clients}-${price}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid gap-6 text-center md:grid-cols-3">
          <div>
            <p className="mb-2 text-sm text-gray-600">Estimated booking value</p>
            <p className="text-3xl font-bold text-gray-900">
              £{monthlyRevenue.toLocaleString('en-GB')}
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">Estimated hours saved</p>
            <p className="text-3xl font-bold text-onprez-green">{hoursBack.toFixed(1)}h</p>
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">After plan cost</p>
            <p className="text-3xl font-bold text-onprez-purple">
              £{netBookingValue.toLocaleString('en-GB')}
            </p>
          </div>
        </div>

        <motion.div
          className="mt-6 border-t border-gray-200 pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-3 text-center">
            <TrendingUp className="h-6 w-6 text-onprez-green" />
            <p className="text-gray-700">
              At this booking value, the Professional plan costs about{' '}
              <strong className="text-onprez-blue">{paybackHours.toFixed(1)} hours</strong> of
              service revenue.
            </p>
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">
            Illustrative estimate only. Actual time savings and booking income vary by business.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
