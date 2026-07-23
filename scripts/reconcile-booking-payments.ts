import { BookingPaymentStatus, BookingRefundStatus } from '@prisma/client'

import { reconcileBookingPayment } from '../src/lib/booking-protection/operations'
import { prisma } from '../src/lib/prisma'

function readArgument(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find(argument => argument.startsWith(prefix))?.slice(prefix.length)
}

function readPositiveInteger(name: string, fallback: number): number {
  const value = readArgument(name)
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive integer`)
  }
  return parsed
}

async function main() {
  const apply = process.argv.includes('--apply')
  const limit = Math.min(readPositiveInteger('limit', 50), 500)
  const olderThanMinutes = readPositiveInteger('older-than-minutes', 15)
  const staleBefore = new Date(Date.now() - olderThanMinutes * 60_000)

  const payments = await prisma.bookingPayment.findMany({
    where: {
      OR: [
        {
          status: {
            in: [
              BookingPaymentStatus.PENDING,
              BookingPaymentStatus.PROCESSING,
              BookingPaymentStatus.REQUIRES_ACTION,
            ],
          },
          updatedAt: { lte: staleBefore },
        },
        {
          refundStatus: {
            in: [BookingRefundStatus.PENDING, BookingRefundStatus.FAILED],
          },
        },
      ],
      providerAccountId: { not: null },
    },
    orderBy: { updatedAt: 'asc' },
    take: limit,
    select: {
      id: true,
      appointmentId: true,
      businessId: true,
      status: true,
      refundStatus: true,
      updatedAt: true,
      lastReconciledAt: true,
    },
  })

  const results: Array<Record<string, unknown>> = []
  for (const payment of payments) {
    if (!apply) {
      results.push({ ...payment, action: 'WOULD_RECONCILE' })
      continue
    }

    try {
      const reconciled = await reconcileBookingPayment(payment.id, 'OPERATIONS_SCRIPT')
      results.push({ ...payment, action: reconciled ? 'RECONCILED' : 'SKIPPED' })
    } catch (error) {
      results.push({
        ...payment,
        action: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'APPLY' : 'DRY_RUN',
        staleBefore,
        selected: payments.length,
        results,
      },
      null,
      2
    )
  )
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
