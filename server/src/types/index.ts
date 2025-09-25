export interface FileMetadata {
  fileId: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  createdUser?: string;
  updatedUser?: string;
  size: number;
  mimeType: string;
  status: string;
  ownerId: string;
  hash: string;
}
