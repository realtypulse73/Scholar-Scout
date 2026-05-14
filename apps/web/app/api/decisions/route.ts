import { NextResponse } from 'next/server';
import { runAndStoreDecisions } from '@/lib/server/platform-store';

export async function GET() {
  return NextResponse.json({ decisions: await runAndStoreDecisions() });
}
