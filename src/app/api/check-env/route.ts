import { NextResponse } from 'next/server'
import { getDatabaseUrls } from '@/lib/db-config'

export async function GET() {
  try {
    const urls = getDatabaseUrls()

    return NextResponse.json({
      nodeEnv: process.env.NODE_ENV,
      databaseEnv: process.env.DATABASE_ENV || 'not set',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPreviewUrl: !!process.env.PREVIEW_DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 40),
      previewUrlPrefix: process.env.PREVIEW_DATABASE_URL?.substring(0, 40),
      configReturnsUrl: urls.url?.substring(0, 40),
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      nodeEnv: process.env.NODE_ENV,
      databaseEnv: process.env.DATABASE_ENV,
    })
  }
}
