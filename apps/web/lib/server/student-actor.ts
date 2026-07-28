import 'server-only';

import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import {
  getActiveGuestLifecycleByCredentialHash,
  hashGuestCredential,
  registerGuestLifecycle,
} from '@/lib/server/data-store';

export const GUEST_ACTOR_COOKIE_NAME = 'scholarscout_guest';
const GUEST_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const guestCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
};

export type StudentActor =
  | {
      kind: 'account';
      accountId: string;
      storageKey: string;
    }
  | {
      kind: 'guest';
      guestId: string;
      storageKey: string;
      guestWindowId: string;
    };

/**
 * Resolves a private actor from trusted server credentials only. Callers cannot
 * nominate storage keys, account ids, guest ids, or staff capability.
 */
export async function resolveStudentActor(input: {
  allowGuest: boolean;
}): Promise<StudentActor | null> {
  const session = await getServerSession(authOptions);
  const accountId = session?.user?.id;

  if (accountId) {
    return {
      kind: 'account',
      accountId,
      storageKey: `account:${accountId}`,
    };
  }

  const cookieStore = await cookies();
  const credential = cookieStore.get(GUEST_ACTOR_COOKIE_NAME)?.value;

  if (credential) {
    const lifecycle = await getActiveGuestLifecycleByCredentialHash(
      hashGuestCredential(credential),
    );

    if (lifecycle) {
      return toGuestActor(lifecycle);
    }
  }

  if (!input.allowGuest) {
    return null;
  }

  const issuedCredential = randomBytes(32).toString('base64url');
  const lifecycle = await registerGuestLifecycle({
    credentialHash: hashGuestCredential(issuedCredential),
  });
  cookieStore.set(
    GUEST_ACTOR_COOKIE_NAME,
    issuedCredential,
    guestCookieOptions,
  );

  return toGuestActor(lifecycle);
}

/** Invalidates the only browser credential used to resolve a guest actor. */
export async function clearGuestActorCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_ACTOR_COOKIE_NAME, '', {
    ...guestCookieOptions,
    maxAge: 0,
  });
}

function toGuestActor(input: {
  id: string;
  quotaWindowId: string;
}): StudentActor {
  return {
    kind: 'guest',
    guestId: input.id,
    storageKey: `guest:${input.id}`,
    guestWindowId: input.quotaWindowId,
  };
}
