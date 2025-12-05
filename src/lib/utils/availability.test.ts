import {
  timeToMinutes,
  minutesToTime,
  doTimesOverlap,
  generateDaySlots,
  DEFAULT_SLOT_CONFIG,
} from './availability'

describe('Availability Utils', () => {
  describe('timeToMinutes', () => {
    it('converts time string to minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0)
      expect(timeToMinutes('09:00')).toBe(540)
      expect(timeToMinutes('12:30')).toBe(750)
      expect(timeToMinutes('23:59')).toBe(1439)
    })
  })

  describe('minutesToTime', () => {
    it('converts minutes to time string', () => {
      expect(minutesToTime(0)).toBe('00:00')
      expect(minutesToTime(540)).toBe('09:00')
      expect(minutesToTime(750)).toBe('12:30')
      expect(minutesToTime(1439)).toBe('23:59')
    })
  })

  describe('doTimesOverlap', () => {
    it('detects overlapping times', () => {
      expect(doTimesOverlap(540, 600, 570, 630)).toBe(true) // 9:00-10:00 overlaps 9:30-10:30
      expect(doTimesOverlap(540, 600, 600, 660)).toBe(false) // 9:00-10:00 doesn't overlap 10:00-11:00
      expect(doTimesOverlap(540, 600, 500, 550)).toBe(true) // 9:00-10:00 overlaps 8:20-9:10
    })
  })

  describe('generateDaySlots', () => {
    it('generates correct number of slots', () => {
      const slots = generateDaySlots(
        '09:00',
        '17:00',
        { ...DEFAULT_SLOT_CONFIG, serviceDuration: 60, slotInterval: 60 },
        [],
        '2025-12-15',
        'Europe/London',
        false
      )
      // 9:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00 = 8 slots for 60min service
      expect(slots.length).toBe(8)
    })

    it('marks all slots as available when no appointments', () => {
      const slots = generateDaySlots(
        '09:00',
        '12:00',
        { ...DEFAULT_SLOT_CONFIG, serviceDuration: 60, slotInterval: 60 },
        [],
        '2025-12-15',
        'Europe/London',
        false
      )
      expect(slots.every(s => s.available)).toBe(true)
    })
  })
})
