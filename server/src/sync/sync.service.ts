import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { ConfigService } from '@nestjs/config';
import { FileMetadata } from '../types';

@Injectable()
export class SyncService {
  private table: string;

  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamo: DynamoDBClient,
    private readonly configService: ConfigService,
  ) {
    this.table = this.configService.get<string>('DYNAMO_TABLE')!;
  }

  async getChangesSince(ownerId: string, since: Date) {
    const queryCommand = new QueryCommand({
      TableName: process.env.DYNAMO_TABLE!,
      KeyConditionExpression: 'ownerId = :ownerId',
      ExpressionAttributeValues: {
        ':ownerId': { S: ownerId },
      },
    });

    const resp = await this.dynamo.send(queryCommand);

    const files: FileMetadata[] = (resp.Items || []).map((item) => ({
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

    const sinceIso = since.toISOString();
    const changed = files.filter((f) => f.modifiedAt > sinceIso);

    return {
      download: changed.filter((f) => f.status === 'active'),
      delete: changed.filter((f) => f.status === 'deleted'),
      lastSync: new Date().toISOString(),
    };
  }
}
