import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { CognitoAuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';

@Controller('sync')
@UseGuards(CognitoAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('changes')
  @ApiBearerAuth('cognitoAuth')
  async getChanges(
    @Query('ownerId') ownerId: string,
    @Query('since') since: string,
  ) {
    const sinceDate =
      since && !isNaN(Date.parse(since)) ? new Date(since) : new Date(0);
    return this.syncService.getChangesSince(ownerId, sinceDate);
  }
}
