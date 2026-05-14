import { NextResponse } from 'next/server';
import { feedItems } from '@/lib/platform';

export async function GET() {
  return NextResponse.json({ paths: feedItems });
}
