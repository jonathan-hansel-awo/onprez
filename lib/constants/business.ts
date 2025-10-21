/**
 *  * Default business settings
  */
  export const DEFAULT_BUSINESS_SETTINGS = {
    bufferTime: 15,
      advanceBookingDays: 30,
        sameDayBooking: true,
          emailNotifications: true,
            smsNotifications: false,
              bookingConfirmation: true,
                reminderEnabled: true,
                  reminderHours: 24,
                    showPrices: true,
                      showDuration: true,
                        requireApproval: false,
                          allowWaitlist: false,
                          }

                          /**
                           * Default business hours (9 AM - 5 PM, Monday - Friday)
                            */
                            export const DEFAULT_BUSINESS_HOURS = [
                              { dayOfWeek: 0, openTime: '09:00', closeTime: '17:00', isClosed: true }, // Sunday
                                { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isClosed: false }, // Monday
                                  { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00', isClosed: false }, // Tuesday
                                    { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00', isClosed: false }, // Wednesday
                                      { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00', isClosed: false }, // Thursday
                                        { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00', isClosed: false }, // Friday
                                          { dayOfWeek: 6, openTime: '09:00', closeTime: '17:00', isClosed: true }, // Saturday
                                          ]

                                          /**
                                           * Supported timezones (common US timezones)
                                            */
                                            export const TIMEZONES = [
                                              { value: 'America/New_York', label: 'Eastern Time (ET)' },
                                                { value: 'America/Chicago', label: 'Central Time (CT)' },
                                                  { value: 'America/Denver', label: 'Mountain Time (MT)' },
                                                    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                                                      { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
                                                        { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
                                                        ] as const

                                                        /**
                                                         * Buffer time options (in minutes)
                                                          */
                                                          export const BUFFER_TIME_OPTIONS = [
                                                            { value: 0, label: 'No buffer' },
                                                              { value: 5, label: '5 minutes' },
                                                                { value: 10, label: '10 minutes' },
                                                                  { value: 15, label: '15 minutes' },
                                                                    { value: 20, label: '20 minutes' },
                                                                      { value: 30, label: '30 minutes' },
                                                                      ] as const

                                                                      /**
                                                                       * Advance booking options (in days)
                                                                        */
                                                                        export const ADVANCE_BOOKING_OPTIONS = [
                                                                          { value: 7, label: '1 week' },
                                                                            { value: 14, label: '2 weeks' },
                                                                              { value: 30, label: '1 month' },
                                                                                { value: 60, label: '2 months' },
                                                                                  { value: 90, label: '3 months' },
                                                                                  ] as const
 */