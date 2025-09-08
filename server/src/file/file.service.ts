import { Injectable, Inject } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { MarkUploadedDto } from './dto/mark-uploaded.dto';

@Injectable()
export class FileService {
  private bucket: string;
  private table: string;

  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    @Inject('DYNAMODB_CLIENT') private readonly dynamo: DynamoDBClient,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('S3_BUCKET_NAME')!;
    this.table = this.configService.get<string>('DYNAMO_TABLE')!;
  }

  async getUploadUrl(fileName: string, ownerId: string) {
    const fileId = uuidv4();
    const key = `${ownerId}/${fileId}/${fileName}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 }); // todo: make constant or move to .env file

    // Store metadata
    await this.dynamo.send(
      new PutItemCommand({
        TableName: this.table,
        Item: {
          ownerId: { S: ownerId },
          fileId: { S: fileId },
          fileName: { S: fileName },
          lastModified: { S: new Date().toISOString() },
          status: { S: 'pending' }, // todo: create enum
        },
      }),
    );

    return { fileId, uploadUrl };
  }

  async markAsUploaded(dto: MarkUploadedDto) {
    const { ownerId, fileId } = dto;

    await this.dynamo.send(
      new UpdateItemCommand({
        TableName: this.table,
        Key: {
          ownerId: { S: ownerId },
          fileId: { S: fileId },
        },
        UpdateExpression: 'SET #status = :active, lastModified = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':active': { S: 'active' },
          ':updatedAt': { S: new Date().toISOString() },
        },
      }),
    );

    return { message: 'File marked as active' };
  }

  async getDownloadUrl(fileId: string, ownerId: string) {
    const { Item } = await this.dynamo.send(
      new GetItemCommand({
        TableName: this.table,
        Key: { ownerId: { S: ownerId }, fileId: { S: fileId } },
      }),
    );

    if (!Item || Item.status?.S === 'deleted')
      throw new Error('File not found');

    const key = `${ownerId}/${fileId}/${Item.fileName?.S}`;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });
    return { fileId, downloadUrl };
  }
}
