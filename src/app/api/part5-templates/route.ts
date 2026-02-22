import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    error: 'Part 5 templates feature temporarily disabled for Next.js 16 compatibility',
    message: 'This feature will be restored after migration to direct function calls'
  }, { status: 501 });
}