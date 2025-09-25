import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CognitoAuthGuard extends AuthGuard('cognitoAuth') {
  getRequest(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (req.cookies && req.cookies.authToken) {
      req.headers.authorization = `Bearer ${req.cookies.authToken}`;
    }
    return req;
  }
}
