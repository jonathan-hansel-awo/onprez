import { NextRequest, NextResponse } from 'next/server'
import { processReminders } from '@/lib/services/reminder'

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Processing reminders...')
    const result = await processReminders()
    console.log(
      `[Cron] Processed ${result.processed} appointments, sent ${result.sent} reminders, ${result.errors} errors`
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[Cron] Reminder processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
