import { Controller, Get, Query } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('changes')
  async getChanges(
    @Query('ownerId') ownerId: string,
    @Query('since') since: string,
  ) {
    const sinceDate =
      since && !isNaN(Date.parse(since)) ? new Date(since) : new Date(0);
    return this.syncService.getChangesSince(ownerId, sinceDate);
  }
}
