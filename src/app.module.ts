import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { FileModule } from './file/file.module';
import { SyncModule } from './sync/sync.module';
import { AwsModule } from './aws/aws.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AWS_REGION: Joi.string().required(),
        S3_BUCKET: Joi.string().required(),
        DYNAMO_TABLE: Joi.string().required(),
      }),
    }),
    AwsModule,
    FileModule,
    SyncModule,
    HealthModule,
  ],
})
export class AppModule {}
