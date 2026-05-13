import { NextResponse } from 'next/server';
import {
  createUser,
  getAccountRoleForEmail,
  type AccountRole,
} from '@/lib/server/data-store';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    name?: string;
    password?: string;
    role?: AccountRole;
  };

  if (!body.email || !body.password || body.password.length < 8) {
    return NextResponse.json(
      { error: 'Email and an 8-character password are required.' },
      { status: 400 },
    );
  }

  try {
    await createUser({
      email: body.email,
      name: body.name ?? '',
      password: body.password,
      role: getAccountRoleForEmail(body.email),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to register.' },
      { status: 400 },
    );
  }
}
