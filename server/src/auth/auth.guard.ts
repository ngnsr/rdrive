import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CognitoAuthGuard extends AuthGuard('cognitoAuth') {
  getRequest(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    // Prefer cookie if exists
    if (req.cookies?.authToken) {
      req.headers.authorization = `Bearer ${req.cookies.authToken}`;
    }
    // Fallback: use Authorization header directly if no cookie
    else if (req.headers.authorization) {
      req.headers.authorization = req.headers.authorization;
    }
    return req;
  }
}
