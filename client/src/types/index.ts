export interface FileItem {
  fileId: string;
  fileName: string;
  size: number;
  createdAt: string | number;
  modifiedAt: string | number;
  owner?: string;
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
  download: { fileId: string; fileName: string }[];
  delete: { fileId: string; fileName: string }[];
  lastSync: string;
};
