import { BookingPaymentStatus, PaymentProvider, Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { businessAuthErrorResponse } from '@/lib/auth/business-access'
import { resolveWritableBusinessContext } from '@/lib/auth/business-route-utils'
import { prisma } from '@/lib/prisma'
import { getStripeClient, isStripeConnectConfigured } from '@/lib/stripe/config'

const RECENT_PAYMENT_LIMIT = 50
const RECENT_PAYOUT_LIMIT = 10

function decimalToMinorUnits(value: Prisma.Decimal | null | undefined) {
  if (!value) return 0
  return Math.round(Number(value.toString()) * 100)
}

function unixSecondsToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null
}

function safePaymentReference(payment: {
  providerChargeId: string | null
  providerPaymentIntentId: string | null
}) {
  const reference = payment.providerChargeId || payment.providerPaymentIntentId
  return reference ? reference.slice(-10) : null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = await resolveWritableBusinessContext(user.id, request, [])
    const businessId = context.businessId

    const [
      connectedAccount,
      recentPayments,
      verifiedAggregate,
      refundedAggregate,
      pendingCount,
      failedCount,
    ] = await Promise.all([
      prisma.stripeConnectedAccount.findUnique({
        where: { businessId },
      }),
      prisma.bookingPayment.findMany({
        where: {
          businessId,
          provider: PaymentProvider.STRIPE,
        },
        orderBy: { createdAt: 'desc' },
        take: RECENT_PAYMENT_LIMIT,
        select: {
          id: true,
          appointmentId: true,
          status: true,
          amount: true,
          currency: true,
          providerPaymentIntentId: true,
          providerChargeId: true,
          refundStatus: true,
          refundedAmount: true,
          refundReason: true,
          paidAt: true,
          failedAt: true,
          refundedAt: true,
          createdAt: true,
          updatedAt: true,
          appointment: {
            select: {
              customerName: true,
              startTime: true,
              service: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.bookingPayment.aggregate({
        where: {
          businessId,
          provider: PaymentProvider.STRIPE,
          status: {
            in: [
              BookingPaymentStatus.SUCCEEDED,
              BookingPaymentStatus.PARTIALLY_REFUNDED,
              BookingPaymentStatus.REFUNDED,
            ],
          },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.bookingPayment.aggregate({
        where: {
          businessId,
          provider: PaymentProvider.STRIPE,
          refundedAmount: { gt: 0 },
        },
        _sum: { refundedAmount: true },
        _count: { _all: true },
      }),
      prisma.bookingPayment.count({
        where: {
          businessId,
          provider: PaymentProvider.STRIPE,
          status: {
            in: [
              BookingPaymentStatus.PENDING,
              BookingPaymentStatus.REQUIRES_ACTION,
              BookingPaymentStatus.PROCESSING,
            ],
          },
        },
      }),
      prisma.bookingPayment.count({
        where: {
          businessId,
          provider: PaymentProvider.STRIPE,
          status: {
            in: [BookingPaymentStatus.FAILED, BookingPaymentStatus.CANCELLED],
          },
        },
      }),
    ])

    const warnings: string[] = []
    let balance: {
      available: Array<{ amountMinor: number; currency: string }>
      pending: Array<{ amountMinor: number; currency: string }>
      livemode: boolean
    } | null = null
    let payouts: Array<{
      id: string
      amountMinor: number
      currency: string
      status: string
      createdAt: string
      expectedArrivalAt: string | null
      method: string
      type: string
      automatic: boolean
      statementDescriptor: string | null
      failureCode: string | null
      failureMessage: string | null
    }> = []

    if (connectedAccount && isStripeConnectConfigured()) {
      const stripe = getStripeClient()
      const requestOptions = { stripeAccount: connectedAccount.stripeAccountId }
      const [balanceResult, payoutsResult] = await Promise.allSettled([
        stripe.balance.retrieve(requestOptions),
        stripe.payouts.list({ limit: RECENT_PAYOUT_LIMIT }, requestOptions),
      ])

      if (balanceResult.status === 'fulfilled') {
        balance = {
          available: balanceResult.value.available.map(item => ({
            amountMinor: item.amount,
            currency: item.currency.toUpperCase(),
          })),
          pending: balanceResult.value.pending.map(item => ({
            amountMinor: item.amount,
            currency: item.currency.toUpperCase(),
          })),
          livemode: balanceResult.value.livemode,
        }
      } else {
        console.error('Stripe connected balance retrieval failed:', balanceResult.reason)
        warnings.push(
          'Stripe could not refresh the live balance. Your verified OnPrez booking-fee history is still shown.'
        )
      }

      if (payoutsResult.status === 'fulfilled') {
        payouts = payoutsResult.value.data.map(payout => ({
          id: payout.id,
          amountMinor: payout.amount,
          currency: payout.currency.toUpperCase(),
          status: payout.status,
          createdAt: unixSecondsToIso(payout.created) as string,
          expectedArrivalAt: unixSecondsToIso(payout.arrival_date),
          method: payout.method,
          type: payout.type,
          automatic: payout.automatic,
          statementDescriptor: payout.statement_descriptor || null,
          failureCode: payout.failure_code || null,
          failureMessage: payout.failure_message || null,
        }))
      } else {
        console.error('Stripe connected payout retrieval failed:', payoutsResult.reason)
        warnings.push(
          'Stripe could not refresh payout history. Your verified OnPrez booking-fee history is still shown.'
        )
      }
    } else if (connectedAccount) {
      warnings.push(
        'Live Stripe balances and payouts are unavailable because Stripe Connect is not configured in this environment.'
      )
    }

    const verifiedGrossMinor = decimalToMinorUnits(verifiedAggregate._sum.amount)
    const refundedMinor = decimalToMinorUnits(refundedAggregate._sum.refundedAmount)

    return NextResponse.json({
      success: true,
      data: {
        business: {
          id: context.business.id,
          name: context.business.name,
          slug: context.business.slug,
        },
        account: connectedAccount
          ? {
              connected: true,
              status: connectedAccount.status,
              chargesEnabled: connectedAccount.chargesEnabled,
              payoutsEnabled: connectedAccount.payoutsEnabled,
              defaultCurrency: connectedAccount.defaultCurrency?.toUpperCase() || 'GBP',
              lastSyncedAt: connectedAccount.lastSyncedAt?.toISOString() || null,
            }
          : {
              connected: false,
              status: null,
              chargesEnabled: false,
              payoutsEnabled: false,
              defaultCurrency: 'GBP',
              lastSyncedAt: null,
            },
        summary: {
          verifiedGrossMinor,
          refundedMinor,
          retainedAfterRefundsMinor: Math.max(0, verifiedGrossMinor - refundedMinor),
          verifiedCount: verifiedAggregate._count._all,
          refundedCount: refundedAggregate._count._all,
          pendingCount,
          failedCount,
        },
        balance,
        payouts,
        payments: recentPayments.map(payment => ({
          id: payment.id,
          appointmentId: payment.appointmentId,
          customerName: payment.appointment.customerName,
          serviceName: payment.appointment.service.name,
          appointmentStartTime: payment.appointment.startTime.toISOString(),
          amountMinor: decimalToMinorUnits(payment.amount),
          currency: payment.currency.toUpperCase(),
          status: payment.status,
          refundStatus: payment.refundStatus,
          refundedAmountMinor: decimalToMinorUnits(payment.refundedAmount),
          refundReason: payment.refundReason,
          reference: safePaymentReference(payment),
          paidAt: payment.paidAt?.toISOString() || null,
          failedAt: payment.failedAt?.toISOString() || null,
          refundedAt: payment.refundedAt?.toISOString() || null,
          createdAt: payment.createdAt.toISOString(),
          updatedAt: payment.updatedAt.toISOString(),
        })),
        liveStripeDataAvailable: Boolean(balance),
        warnings,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    const authResponse = businessAuthErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Get money dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load booking-fee information' },
      { status: 500 }
    )
  }
}
