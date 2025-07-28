import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Comprehensive system status check
    const checks = await Promise.allSettled([
      // Database connectivity
      prisma.$queryRaw`SELECT NOW() as current_time`,
      
      // Test Telegram Bot API
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`),
      
      // Test Cloudinary connectivity
      fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/list`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}`
        }
      }),
      
      // Test Resend API
      fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        }
      })
    ]);

    const responseTime = Date.now() - startTime;

    // Process check results
    const systemStatus = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV,
      deployment: {
        url: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL,
        region: process.env.VERCEL_REGION || 'local',
        buildId: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 'local',
      },
      services: {
        database: {
          status: checks[0].status === 'fulfilled' ? 'up' : 'down',
          responseTime: checks[0].status === 'fulfilled' ? 'fast' : 'slow',
          error: checks[0].status === 'rejected' ? (checks[0].reason as Error).message : null
        },
        telegram: {
          status: checks[1].status === 'fulfilled' && (checks[1].value as Response).ok ? 'up' : 'down',
          error: checks[1].status === 'rejected' ? (checks[1].reason as Error).message : null
        },
        cloudinary: {
          status: checks[2].status === 'fulfilled' && (checks[2].value as Response).ok ? 'up' : 'down',
          error: checks[2].status === 'rejected' ? (checks[2].reason as Error).message : null
        },
        email: {
          status: checks[3].status === 'fulfilled' && (checks[3].value as Response).ok ? 'up' : 'down',
          error: checks[3].status === 'rejected' ? (checks[3].reason as Error).message : null
        }
      },
      metrics: {
        uptime: process.uptime(),
        memory: {
          used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        },
        cpu: process.cpuUsage(),
        activeConnections: (global as any).activeConnections || 0
      }
    };

    // Determine overall status
    const serviceStatuses = Object.values(systemStatus.services).map(s => s.status);
    if (serviceStatuses.includes('down')) {
      systemStatus.status = serviceStatuses.filter(s => s === 'down').length > 2 ? 'critical' : 'degraded';
    }

    const statusCode = systemStatus.status === 'operational' ? 200 : 
                      systemStatus.status === 'degraded' ? 207 : 503;

    return NextResponse.json(systemStatus, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? error.message : 'System check failed',
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