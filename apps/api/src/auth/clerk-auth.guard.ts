import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';

type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  userId?: string;
};

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext) {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing Authorization bearer token.');
    }

    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    const jwtKey = this.configService.get<string>('CLERK_JWT_KEY');

    if (!secretKey && !jwtKey) {
      throw new UnauthorizedException('Clerk authentication is not configured.');
    }

    const payload = await verifyToken(token, {
      secretKey,
      jwtKey,
      authorizedParties: this.parseAuthorizedParties(),
    });

    if (!payload.sub) {
      throw new UnauthorizedException('Token does not contain a Clerk user id.');
    }

    request.userId = payload.sub;
    return true;
  }

  private extractBearerToken(value?: string | string[]) {
    const headerValue = Array.isArray(value) ? value[0] : value;

    if (!headerValue) {
      return null;
    }

    const [scheme, token] = headerValue.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private parseAuthorizedParties() {
    const configuredValue = this.configService.get<string>(
      'CLERK_AUTHORIZED_PARTIES',
    );

    if (!configuredValue) {
      return ['http://localhost:3000'];
    }

    return configuredValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
}
