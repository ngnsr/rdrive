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
      TableName: this.table,
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
      updatedAt: item.updatedAt?.S || new Date().toISOString(),
      size: item.size ? parseInt(item.size.N!) : 0,
      mimeType: item.mimeType?.S || '',
      status: item.status.S!,
      ownerId: item.ownerId.S!,
      hash: item.hash?.S || '',
    }));

    const sinceIso = since.toISOString();
    const changedFiles = files.filter((f) => f.updatedAt > sinceIso);

    const added: FileMetadata[] = [];
    const modified: FileMetadata[] = [];
    const removed: FileMetadata[] = [];

    for (const file of changedFiles) {
      if (file.status === 'active') {
        if (new Date(file.createdAt) >= since) added.push(file);
        else modified.push(file);
      } else if (file.status === 'deleted') {
        removed.push(file);
      }
    }

    return {
      added,
      modified,
      removed,
      lastSync: new Date().toISOString(),
    };
  }
}
