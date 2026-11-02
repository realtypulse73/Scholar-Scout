/** @jest-environment node */

describe('Preview owner Auth.js callback', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      VERCEL: '1',
      VERCEL_ENV: 'preview',
      NEXTAUTH_SECRET: 'preview-test-secret',
      SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO: 'true',
      SCHOLARSCOUT_PREVIEW_OWNER_MEDIA_DEMO_OWNER_EMAIL: 'owner@example.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('accepts the configured Preview owner signed handoff in the Auth.js callback', async () => {
    let nextAuth!: typeof import('next-auth').default;
    let authOptions!: import('next-auth').NextAuthOptions;
    let issuePreviewOwnerCredentialGrant!: (input: {
      user: {
        id: string;
        name: string;
        email: string;
        role: 'student';
        passwordHash: string;
        createdAt: string;
      };
    }) => string | null;

    await jest.isolateModulesAsync(async () => {
      ({ default: nextAuth } = await import('next-auth'));
      ({ authOptions } = await import('@/auth'));
      ({ issuePreviewOwnerCredentialGrant } = await import('@/lib/server/data-store'));
    });

    const handler = nextAuth(authOptions) as unknown as (
      request: NodeLikeRequest,
      response: NodeLikeResponse,
    ) => Promise<void>;
    const csrfResponse = createResponse();
    await handler({
      method: 'GET',
      query: { nextauth: ['csrf'] },
      headers: { host: 'preview.example.com', 'x-forwarded-proto': 'https' },
      cookies: {},
    }, csrfResponse);
    expect(csrfResponse.statusCode).toBe(200);
    expect(csrfResponse.body?.csrfToken).toEqual(expect.any(String));
    const csrfCookie = getCookie(csrfResponse, 'next-auth.csrf-token');
    expect(csrfCookie?.value).toEqual(expect.any(String));

    const grant = issuePreviewOwnerCredentialGrant({
      user: {
        id: 'owner-id',
        name: 'Preview owner',
        email: 'owner@example.com',
        role: 'student',
        passwordHash: 'not-in-grant',
        createdAt: '2026-11-02T00:00:00.000Z',
      },
    });
    expect(grant).toEqual(expect.any(String));

    const callbackResponse = createResponse();
    await handler({
      method: 'POST',
      query: { nextauth: ['callback', 'credentials'] },
      headers: { host: 'preview.example.com', 'x-forwarded-proto': 'https' },
      cookies: { [csrfCookie!.name]: csrfCookie!.value },
      body: {
        csrfToken: csrfResponse.body!.csrfToken!,
        grant: grant!,
        callbackUrl: 'https://preview.example.com/profile',
        json: 'true',
      },
    }, callbackResponse);

    expect(callbackResponse.statusCode).toBe(200);
    expect(callbackResponse.body).toMatchObject({
      url: 'https://preview.example.com/profile',
    });
    expect(getCookie(callbackResponse, 'next-auth.session-token')?.value).toEqual(expect.any(String));
  });
});

interface NodeLikeRequest {
  method: 'GET' | 'POST';
  query: { nextauth: string[] };
  headers: Record<string, string>;
  cookies: Record<string, string>;
  body?: Record<string, string | boolean>;
}

interface NodeLikeResponse {
  body?: Record<string, string>;
  headers: Record<string, string | string[]>;
  statusCode: number;
  status: (status: number) => NodeLikeResponse;
  getHeader: (key: string) => string | string[] | undefined;
  setHeader: (key: string, value: string | string[]) => NodeLikeResponse;
  json: (body: Record<string, string>) => NodeLikeResponse;
  send: (body: Record<string, string>) => NodeLikeResponse;
  end: () => void;
}

function createResponse(): NodeLikeResponse {
  const response: NodeLikeResponse = {
    headers: {},
    statusCode: 200,
    status(status) {
      response.statusCode = status;
      return response;
    },
    setHeader(key, value) {
      const matchingKey = Object.keys(response.headers).find(
        (candidate) => candidate.toLowerCase() === key.toLowerCase(),
      );
      if (matchingKey) {
        delete response.headers[matchingKey];
      }
      response.headers[key] = value;
      return response;
    },
    getHeader(key) {
      const matchingKey = Object.keys(response.headers).find(
        (candidate) => candidate.toLowerCase() === key.toLowerCase(),
      );
      return matchingKey ? response.headers[matchingKey] : undefined;
    },
    json(body) {
      response.body = body;
      return response;
    },
    send(body) {
      response.body = body;
      return response;
    },
    end() {},
  };
  return response;
}

function getCookie(response: NodeLikeResponse, name: string): { name: string; value: string } | null {
  const header = response.getHeader('Set-Cookie');
  const values = Array.isArray(header) ? header : [header];
  const cookie = values.find((candidate) => candidate?.includes(name));
  const firstSegment = cookie?.split(';')[0];
  if (!firstSegment) {
    return null;
  }

  const separator = firstSegment.indexOf('=');
  if (separator < 1 || !firstSegment.slice(0, separator).endsWith(name)) {
    return null;
  }

  return {
    name: firstSegment.slice(0, separator),
    value: decodeURIComponent(firstSegment.slice(separator + 1)),
  };
}
