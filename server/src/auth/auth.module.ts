import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CognitoAuthStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [PassportModule],
  providers: [AuthService, CognitoAuthStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
