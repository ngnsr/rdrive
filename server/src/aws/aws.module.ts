import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'S3_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new S3Client({
          region: configService.get<string>('AWS_REGION_S3', 'us-east-1'),
          credentials: {
            accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
            secretAccessKey: configService.get<string>(
              'AWS_SECRET_ACCESS_KEY',
            )!,
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'DYNAMODB_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new DynamoDBClient({
          region: configService.get<string>('AWS_REGION_DYNAMO', 'us-east-1'),
          credentials: {
            accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
            secretAccessKey: configService.get<string>(
              'AWS_SECRET_ACCESS_KEY',
            )!,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['S3_CLIENT', 'DYNAMODB_CLIENT'],
})
export class AwsModule {}
