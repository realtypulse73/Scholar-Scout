import { NextResponse } from 'next/server';
import { getMemory, updateMemory } from '@/lib/server/platform-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userKey = searchParams.get('userKey') ?? 'local-student';

  return NextResponse.json({ memory: await getMemory(userKey) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { userKey?: string };

  return NextResponse.json({
    memory: await updateMemory(body.userKey ?? 'local-student'),
  });
}
