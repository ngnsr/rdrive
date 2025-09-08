import { Injectable, Inject } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { MarkUploadedDto } from './dto/mark-uploaded.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileStatus } from '../common/enums/file-status.enum';
import { FileMetadata } from '../types';

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

  async getUploadUrl(dto: UploadFileDto) {
    const { fileName, ownerId, size, mimeType, hash, createdAt, modifiedAt } =
      dto;
    const fileId = uuidv4();
    const now = new Date().toISOString();
    const key = `${ownerId}/${fileId}/${fileName}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });

    // Store metadata
    await this.dynamo.send(
      new PutItemCommand({
        TableName: this.table,
        Item: {
          ownerId: { S: ownerId },
          fileId: { S: fileId },
          fileName: { S: fileName },
          size: { N: size.toString() },
          mimeType: { S: mimeType },
          createdAt: { S: createdAt },
          modifiedAt: { S: modifiedAt },
          status: { S: FileStatus.pending },
          hash: { S: hash },
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
          ':active': { S: FileStatus.active },
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

    if (!Item || Item.status?.S === FileStatus.deleted)
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

  async getAllOwnerFiles(ownerId: string): Promise<FileMetadata[]> {
    const scanCommand = new ScanCommand({
      TableName: this.table,
      FilterExpression: 'ownerId = :ownerId AND #status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':ownerId': { S: ownerId },
        ':active': { S: FileStatus.active },
      },
    });

    const { Items } = await this.dynamo.send(scanCommand);

    return (Items || []).map((item) => ({
      fileId: item.fileId.S!,
      fileName: item.fileName.S!,
      createdAt: item.createdAt?.S || new Date().toISOString(),
      modifiedAt: item.modifiedAt?.S || new Date().toISOString(),
      size: item.size ? parseInt(item.size.N!) : 0,
      mimeType: item.mimeType?.S || '',
      status: item.status.S!,
      ownerId: item.ownerId.S!,
      hash: item.hash?.S || '',
    }));
  }

  async deleteFile(fileId: string, ownerId: string) {
    // Fetch file metadata from DynamoDB
    const getCommand = new GetItemCommand({
      TableName: this.table,
      Key: {
        ownerId: { S: ownerId },
        fileId: { S: fileId },
      },
    });

    const { Item } = await this.dynamo.send(getCommand);
    if (!Item) {
      throw new Error('File not found');
    }

    const key = `${ownerId}/${fileId}/${Item.fileName.S}`;

    // Delete from S3
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    // Update DynamoDB status to deleted
    await this.dynamo.send(
      new UpdateItemCommand({
        TableName: this.table,
        Key: { ownerId: { S: ownerId }, fileId: { S: fileId } },
        UpdateExpression: 'SET #status = :deleted, modifiedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':deleted': { S: FileStatus.deleted },
          ':updatedAt': { S: new Date().toISOString() },
        },
      }),
    );
  }
}
