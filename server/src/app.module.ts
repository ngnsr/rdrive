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
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),

        COGNITO_USER_POOL_ID: Joi.string().required(),
        COGNITO_CLIENT_ID: Joi.string().required(),
        AWS_REGION_COGNITO: Joi.string().required(),

        DYNAMO_TABLE: Joi.string().required(),
        AWS_REGION_DYNAMO: Joi.string().required(),

        S3_BUCKET_NAME: Joi.string().required(),
        AWS_REGION_S3: Joi.string().required(),
      }),
    }),
    AwsModule,
    FileModule,
    SyncModule,
    HealthModule,
  ],
})
export class AppModule {}
