export interface BookingData {
  // Service info
  serviceId: string | null
  serviceName: string | null
  servicePrice: number | null
  serviceDuration: number | null

  // Date/time
  date: Date | null
  timeSlot: string | null // "09:00"
  endTime: string | null // "10:00"

  // Customer info
  customerName: string
  customerEmail: string
  customerPhone: string
  customerNotes: string
}

export interface BookingConfirmation {
  id: string
  confirmationNumber: string
  status: string
  startTime: string
  endTime: string
  service: {
    name: string
    price: number
    duration: number
  }
  customer: {
    name: string
    email: string
  }
  business: {
    name: string
    timezone: string
    address?: string
  }
  notes: string | null
  createdAt: string
}

export interface CreateBookingPayload {
  businessId: string
  serviceId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerNotes?: string
}
