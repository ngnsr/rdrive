import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import pjson from '../../package.json';
import { HealthService } from './health.service';
import { CognitoAuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  @Get('ping')
  ping() {
    return { message: 'pong', version: pjson.version };
  }

  @Get('protected')
  @ApiBearerAuth('cognitoAuth')
  @UseGuards(CognitoAuthGuard)
  protectedPing(@Req() req: any) {
    return {
      message: 'pong',
      version: pjson.version,
      profile: req.user,
    };
  }

  @Get('test')
@UseGuards(CognitoAuthGuard)
@ApiBearerAuth('cognitoAuth')
test(@Req() req) {
  return { user: req.user };
}

  @Get('readiness')
  @HealthCheck()
  async readiness() {
    return this.health.check([
      async () => this.http.pingCheck('example', 'https://example.com'),
    ]);
  }

  @Get('full')
  @HealthCheck()
  async fullCheck() {
    return this.healthService.fullCheck();
  }
}
