export interface FileItem {
  fileId: string;
  fileName: string;
  size: number;
  createdAt: string | number;
  modifiedAt: string | number;
  owner?: string;
  hash?: string;
}
