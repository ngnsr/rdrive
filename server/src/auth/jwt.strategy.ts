import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';

@Injectable()
export class CognitoAuthStrategy extends PassportStrategy(
  Strategy,
  'cognitoAuth',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `https://cognito-idp.${configService.get(
          'AWS_REGION_COGNITO',
        )}.amazonaws.com/${configService.get('COGNITO_USER_POOL_ID')}/.well-known/jwks.json`,
      }),
      audience: configService.get('COGNITO_CLIENT_ID'),
      issuer: `https://cognito-idp.${configService.get('AWS_REGION_COGNITO')}.amazonaws.com/${configService.get(
        'COGNITO_USER_POOL_ID',
      )}`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }
    return new UserProfileDto(
      payload.sub,
      payload['cognito:username'],
      payload.email,
      payload.name,
    );
  }
}
