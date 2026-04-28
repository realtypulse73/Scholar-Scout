import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';

import { ClerkAuthGuard } from './clerk-auth.guard';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

describe('ClerkAuthGuard', () => {
  const getRequest = (authorization?: string) => ({
    headers: { authorization },
    userId: undefined,
  });

  const makeContext = (request: ReturnType<typeof getRequest>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects missing bearer tokens', async () => {
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const guard = new ClerkAuthGuard(configService);

    await expect(guard.canActivate(makeContext(getRequest()))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when Clerk auth is not configured', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const guard = new ClerkAuthGuard(configService);

    await expect(
      guard.canActivate(makeContext(getRequest('Bearer token_123'))),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('stores the verified Clerk user id on the request', async () => {
    const configService = {
      get: jest
        .fn()
        .mockImplementation((key: string) =>
          key === 'CLERK_SECRET_KEY' ? 'sk_test_123' : undefined,
        ),
    } as unknown as ConfigService;
    const request = getRequest('Bearer token_123');
    const guard = new ClerkAuthGuard(configService);

    (verifyToken as jest.Mock).mockResolvedValue({
      sub: 'user_123',
    });

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.userId).toBe('user_123');
    expect(verifyToken).toHaveBeenCalledWith(
      'token_123',
      expect.objectContaining({
        secretKey: 'sk_test_123',
        authorizedParties: ['http://localhost:3000'],
      }),
    );
  });
});
