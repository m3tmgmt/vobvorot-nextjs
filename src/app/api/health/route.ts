import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'TELEGRAM_BOT_TOKEN',
      'CLOUDINARY_CLOUD_NAME',
      'RESEND_API_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'connected',
        environment: missingEnvVars.length === 0 ? 'complete' : 'incomplete',
        missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined,
      },
      deployment: {
        url: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL,
        region: process.env.VERCEL_REGION || 'local',
        buildId: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 'local',
      }
    };

    return NextResponse.json(healthStatus, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV,
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}