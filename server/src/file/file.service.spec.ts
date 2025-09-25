import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from './file.service';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { FileStatus } from '../common/enums/file-status.enum';
import { UploadFileDto } from './dto/upload-file.dto';
import { MarkUploadedDto } from './dto/mark-uploaded.dto';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('FileService', () => {
  let service: FileService;
  const mockS3Client = { send: jest.fn() } as unknown as S3Client;
  const mockDynamoClient = { send: jest.fn() } as unknown as DynamoDBClient;
  const mockConfigService = { get: jest.fn() } as unknown as ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    (mockConfigService.get as jest.Mock).mockImplementation((key) => {
      if (key === 'S3_BUCKET_NAME') return 'bucket';
      if (key === 'DYNAMO_TABLE') return 'table';
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: 'S3_CLIENT', useValue: mockS3Client },
        { provide: 'DYNAMODB_CLIENT', useValue: mockDynamoClient },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should generate upload URL and store metadata', async () => {
    (uuidv4 as jest.Mock).mockReturnValue('uuid-file');
    (getSignedUrl as jest.Mock).mockResolvedValue('http://signed-url');
    (mockDynamoClient.send as jest.Mock).mockResolvedValue({});

    const dto: UploadFileDto = {
      ownerId: 'user1',
      fileName: 'file.txt',
      size: 123,
      mimeType: 'text/plain',
      hash: 'abc123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdUser: 'tester',
      updatedUser: 'tester',
    };

    const result = await service.getUploadUrl(dto);

    expect(result).toEqual({
      fileId: 'uuid-file',
      uploadUrl: 'http://signed-url',
    });
    expect(mockDynamoClient.send).toHaveBeenCalledWith(
      expect.any(PutItemCommand),
    );
    expect(getSignedUrl).toHaveBeenCalledWith(
      mockS3Client,
      expect.any(PutObjectCommand),
      { expiresIn: 3600 },
    );
  });

  it('should mark file as uploaded', async () => {
    const dto: MarkUploadedDto = { ownerId: 'user1', fileId: 'file1' };
    (mockDynamoClient.send as jest.Mock).mockResolvedValue({});

    const result = await service.markAsUploaded(dto);

    expect(result).toEqual({ message: 'File marked as active' });
    expect(mockDynamoClient.send).toHaveBeenCalledWith(
      expect.any(UpdateItemCommand),
    );
  });

  it('should return download URL for a file', async () => {
    (mockDynamoClient.send as jest.Mock).mockResolvedValue({
      Item: { fileName: { S: 'file.txt' }, status: { S: FileStatus.active } },
    });
    (getSignedUrl as jest.Mock).mockResolvedValue('http://download-url');

    const result = await service.getDownloadUrl('file1', 'user1');

    expect(result).toEqual({
      fileId: 'file1',
      downloadUrl: 'http://download-url',
    });
    expect(getSignedUrl).toHaveBeenCalledWith(
      mockS3Client,
      expect.any(GetObjectCommand),
      { expiresIn: 3600 },
    );
  });

  it('should throw error if file not found on download', async () => {
    (mockDynamoClient.send as jest.Mock).mockResolvedValue({ Item: null });

    await expect(service.getDownloadUrl('file1', 'user1')).rejects.toThrow(
      'File not found',
    );
  });

  it('should delete file from S3 and mark as deleted in DynamoDB', async () => {
    (mockDynamoClient.send as jest.Mock)
      .mockResolvedValueOnce({ Item: { fileName: { S: 'file.txt' } } }) // get item
      .mockResolvedValueOnce({}); // update item

    (mockS3Client.send as jest.Mock).mockResolvedValue({});

    await service.deleteFile('file1', 'user1');

    expect(mockS3Client.send).toHaveBeenCalledWith(
      expect.any(DeleteObjectCommand),
    );
    expect(mockDynamoClient.send).toHaveBeenCalledWith(
      expect.any(UpdateItemCommand),
    );
  });
});
