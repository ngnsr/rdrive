import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `https://cognito-idp.${configService.get(
          'AWS_REGION',
        )}.amazonaws.com/${configService.get('COGNITO_USER_POOL_ID')}/.well-known/jwks.json`,
      }),
      audience: configService.get('COGNITO_CLIENT_ID'),
      issuer: `https://cognito-idp.${configService.get('AWS_REGION')}.amazonaws.com/${configService.get(
        'COGNITO_USER_POOL_ID',
      )}`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload['cognito:username'] };
  }
}
