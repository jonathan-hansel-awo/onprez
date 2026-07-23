/** @jest-environment node */

import { ServiceDepositMode } from '@prisma/client'

import {
  DEFAULT_BOOKING_PROTECTION,
  readBookingProtectionDefaults,
  resolveEffectiveServiceDeposit,
} from '../config'

describe('Booking Protection configuration', () => {
  it('reads safe business defaults from JSON settings', () => {
    expect(
      readBookingProtectionDefaults({
        bookingProtection: {
          enabled: true,
          depositAmount: 10,
          cancellationWindowHours: 48,
          deductFromTotal: false,
        },
      })
    ).toEqual({
      ...DEFAULT_BOOKING_PROTECTION,
      enabled: true,
      depositAmount: 10,
      cancellationWindowHours: 48,
    })
  })

  it('resolves the business default and deducts it from the service total', () => {
    expect(
      resolveEffectiveServiceDeposit({
        mode: ServiceDepositMode.BUSINESS_DEFAULT,
        customDepositAmount: null,
        servicePrice: 60,
        defaults: { ...DEFAULT_BOOKING_PROTECTION, enabled: true },
        entitled: true,
        stripeReady: true,
      })
    ).toMatchObject({
      requiresDeposit: true,
      depositAmount: 10,
      remainingAmount: 50,
      cancellationWindowHours: 24,
      source: 'BUSINESS_DEFAULT',
    })
  })

  it('supports a custom fixed deposit', () => {
    expect(
      resolveEffectiveServiceDeposit({
        mode: ServiceDepositMode.CUSTOM,
        customDepositAmount: 25,
        servicePrice: 100,
        defaults: DEFAULT_BOOKING_PROTECTION,
        entitled: true,
        stripeReady: true,
      })
    ).toMatchObject({ requiresDeposit: true, depositAmount: 25, remainingAmount: 75 })
  })

  it('never exposes deposits without entitlement and Stripe readiness', () => {
    expect(
      resolveEffectiveServiceDeposit({
        mode: ServiceDepositMode.CUSTOM,
        customDepositAmount: 10,
        servicePrice: 50,
        defaults: DEFAULT_BOOKING_PROTECTION,
        entitled: false,
        stripeReady: true,
      })
    ).toMatchObject({ requiresDeposit: false, unavailableReason: 'FEATURE_NOT_ENTITLED' })

    expect(
      resolveEffectiveServiceDeposit({
        mode: ServiceDepositMode.CUSTOM,
        customDepositAmount: 10,
        servicePrice: 50,
        defaults: DEFAULT_BOOKING_PROTECTION,
        entitled: true,
        stripeReady: false,
      })
    ).toMatchObject({ requiresDeposit: false, unavailableReason: 'STRIPE_NOT_READY' })
  })

  it('does not allow a deposit above the service price', () => {
    expect(
      resolveEffectiveServiceDeposit({
        mode: ServiceDepositMode.BUSINESS_DEFAULT,
        customDepositAmount: null,
        servicePrice: 8,
        defaults: { ...DEFAULT_BOOKING_PROTECTION, enabled: true, depositAmount: 10 },
        entitled: true,
        stripeReady: true,
      })
    ).toMatchObject({ requiresDeposit: false, unavailableReason: 'DEPOSIT_EXCEEDS_PRICE' })
  })
})
