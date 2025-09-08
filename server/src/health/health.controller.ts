import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import pjson from '../../package.json';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/auth.guard';

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
  @UseGuards(JwtAuthGuard)
  protectedPing(@Req() req: any) {
    return {
      message: 'pong',
      version: pjson.version,
      profile: req.user,
    };
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
