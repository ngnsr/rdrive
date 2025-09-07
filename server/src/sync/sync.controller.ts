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
    return this.syncService.getChangesSince(ownerId, new Date(since));
  }
}
