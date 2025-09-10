export interface FileItem {
  fileId: string;
  fileName: string;
  size: number;
  createdAt: string | number;
  modifiedAt: string | number;
  ownerId: string;
  hash?: string;
}

export type ServerFile = {
  fileId: string;
  fileName: string;
  createdAt: string;
  modifiedAt: string;
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
