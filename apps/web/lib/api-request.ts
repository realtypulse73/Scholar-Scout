export type JsonRequestResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: 'body-too-large' | 'invalid-json' | 'invalid-body';
    };

export interface ParseJsonRequestOptions<T> {
  maxBytes: number;
  validate(value: unknown): T | null;
}

/**
 * Reads an untrusted request only up to its byte limit, then delegates shape
 * validation to the owning route. Expected parse failures never expose errors.
 */
export async function parseJsonRequest<T>(
  request: Pick<Request, 'body' | 'headers'>,
  options: ParseJsonRequestOptions<T>,
): Promise<JsonRequestResult<T>> {
  if (!Number.isSafeInteger(options.maxBytes) || options.maxBytes < 0) {
    return { ok: false, error: 'invalid-body' };
  }

  const declaredLength = parseContentLength(request.headers.get('content-length'));

  if (declaredLength !== null && declaredLength > options.maxBytes) {
    return { ok: false, error: 'body-too-large' };
  }

  const bodyResult = await readBoundedBody(request.body, options.maxBytes);

  if (!bodyResult.ok) {
    return bodyResult;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(bodyResult.text);
  } catch {
    return { ok: false, error: 'invalid-json' };
  }

  try {
    const value = options.validate(parsed);

    return value === null
      ? { ok: false, error: 'invalid-body' }
      : { ok: true, value };
  } catch {
    return { ok: false, error: 'invalid-body' };
  }
}

/**
 * Returns true only for a plain object containing no keys outside the route's
 * declared contract. Routes retain responsibility for required fields and bounds.
 */
export function isExactObject(
  value: unknown,
  allowedKeys: readonly string[],
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return keys.every((key) => allowedKeys.includes(key));
}

async function readBoundedBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<{ ok: true; text: string } | { ok: false; error: 'body-too-large' | 'invalid-body' }> {
  if (!body) {
    return { ok: true, text: '' };
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return { ok: true, text: text + decoder.decode() };
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, error: 'body-too-large' };
      }

      text += decoder.decode(value, { stream: true });
    }
  } catch {
    return { ok: false, error: 'invalid-body' };
  }
}

function parseContentLength(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
