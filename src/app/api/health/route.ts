import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get counts
    const [users, businesses, services] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.service.count(),
    ]);

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      counts: {
        users,
        businesses,
        services,
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 500 },
    );
  }
}
