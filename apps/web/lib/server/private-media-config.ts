import 'server-only';

/** Reads either the legacy application names or Vercel's generated prefixed names. */
export function getPrivateMediaStoreId(): string | undefined {
  return process.env.SCHOLARSCOUT_PRIVATE_MEDIA_STORE_ID
    ?? process.env.SCHOLARSCOUT_PRIVATE_MEDIA__STORE_ID;
}

/** Reads either the legacy application names or Vercel's generated prefixed names. */
export function getPrivateMediaWebhookPublicKey(): string | undefined {
  return process.env.SCHOLARSCOUT_PRIVATE_MEDIA_WEBHOOK_PUBLIC_KEY
    ?? process.env.SCHOLARSCOUT_PRIVATE_MEDIA__WEBHOOK_PUBLIC_KEY;
}
