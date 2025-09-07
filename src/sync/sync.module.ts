import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [AwsModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
