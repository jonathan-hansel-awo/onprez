import { NextResponse } from 'next/server'

import { logApiError } from '@/lib/api/error-response'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
}

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({ ok: true }, { headers: RESPONSE_HEADERS })
  } catch (error) {
    logApiError('health-check', error)

    return NextResponse.json({ ok: false }, { status: 503, headers: RESPONSE_HEADERS })
  }
}
