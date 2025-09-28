export interface FileItem {
  fileId: string;
  ownerId: string;
  fileName: string;
  size: number;
  mimeType: string;
  hash: string;
  createdAt: string;
  updatedAt: string;
  createdUser: string;
  updatedUser: string;
}

export interface ServerFile {
  fileId: string;
  ownerId: string;
  fileName: string;
  size: number;
  mimeType: string;
  hash: string;
  createdAt: string;
  updatedAt: string;
  createdUser: string;
  updatedUser: string;
}

export interface SyncResponse {
  added?: FileItem[];
  modified?: FileItem[];
  removed?: FileItem[];
  lastSync: number;
}
