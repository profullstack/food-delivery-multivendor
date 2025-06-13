import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - you can add more sophisticated checks here
    // like database connectivity, external service checks, etc.
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'enatega-admin-panel'
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'enatega-admin-panel',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}