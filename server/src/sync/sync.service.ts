// src/sync/sync.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { ConfigService } from '@nestjs/config';

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
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: {
          ':ownerId': { S: ownerId },
        },
      }),
    );

    const changes = (result.Items || [])
      .filter((item) => {
        const lastModified = item.lastModified?.S;
        if (!lastModified) return false;
        return new Date(lastModified) > since;
      })
      .map((item) => ({
        fileId: item.fileId?.S || '',
        fileName: item.fileName?.S || '',
        lastModified: item.lastModified?.S || null,
        status: item.status?.S || 'active',
        size: item.size?.N ? Number(item.size.N) : null,
        hash: item.hash?.S || null,
      }));

    return changes;
  }
}
