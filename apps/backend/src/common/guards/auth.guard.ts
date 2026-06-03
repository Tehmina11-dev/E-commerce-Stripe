import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Minimal authentication guard placeholder.
 * Replace the token validation logic with your real auth provider (JWT, etc.).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    // TODO: validate token and attach the resolved user to the request.
    request.user = { id: 'demo-user', email: 'demo@example.com' };
    return true;
  }
}
