export interface FileItem {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  ownerId: string;
  hash?: string;
  createdUser?: string;
  updatedUser?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServerFile = {
  fileId: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  createdUser?: string;
  updatedUser?: string;
  mimeType: string;
  hash: string;
  size: number;
};

export type SyncResponse = {
  added: FileItem[];
  modified: FileItem[];
  removed: { fileId: string; fileName: string }[];
  lastSync: string;
};

export type User = { loginId: string } | null;
