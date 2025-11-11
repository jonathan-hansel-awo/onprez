// src/app/api/debug/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasEnvVars: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_ENV: process.env.DATABASE_ENV || 'not set',
      PREVIEW_DATABASE_URL: !!process.env.PREVIEW_DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    },
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
  }

  // Test 1: Can we import db-config?
  try {
    const { getDatabaseUrls } = await import('@/lib/db-config')
    const urls = getDatabaseUrls()
    diagnostics.dbConfig = {
      success: true,
      hasUrl: !!urls.url,
      urlPrefix: urls.url?.substring(0, 30) + '...',
    }
  } catch (error) {
    diagnostics.dbConfig = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Test 2: Can we import Prisma?
  try {
    const { prisma } = await import('@/lib/prisma')
    diagnostics.prismaImport = {
      success: true,
      hasPrisma: !!prisma,
    }

    // Test 3: Can we connect?
    try {
      await prisma.$connect()
      diagnostics.prismaConnect = {
        success: true,
      }

      // Test 4: Can we query?
      try {
        const count = await prisma.business.count()
        diagnostics.prismaQuery = {
          success: true,
          businessCount: count,
        }
      } catch (error) {
        diagnostics.prismaQuery = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        }
      }
    } catch (error) {
      diagnostics.prismaConnect = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  } catch (error) {
    diagnostics.prismaImport = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
