import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    error: 'Passage generation feature temporarily disabled for Next.js 16 compatibility',
    message: 'This feature will be restored after migration to direct function calls'
  }, { status: 501 });
}