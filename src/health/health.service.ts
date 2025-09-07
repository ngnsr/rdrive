import { Injectable } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  async check() {
    return {
      status: 'ok',
      liveness: true,
      timestamp: new Date().toISOString(),
    };
  }

  async fullCheck() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () =>
        this.disk.checkStorage('disk', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
