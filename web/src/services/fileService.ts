import axios from "axios";
import type { FileItem, ServerFile } from "../types";
import { computeFileHash } from "../utils/fileUtils";

const getUploadedFilesKey = (userId: string) => `uploadedFiles_${userId}`;

class FileService {
  private currentFiles: FileItem[] = [];
  private filterType = "all";
  private baseUrl = import.meta.env.VITE_API_BASE_URL;
  private store = window.store;

  private getUploadedFiles(ownerId: string) {
    return (this.store.get(getUploadedFilesKey(ownerId)) || {}) as Record<
      string,
      string
    >;
  }

  private setUploadedFiles(
    ownerId: string,
    uploadedFiles: Record<string, string>
  ) {
    console.log("Setting cache as", uploadedFiles);
    this.store.set(getUploadedFilesKey(ownerId), uploadedFiles);
  }

  async fetchFiles(ownerId: string): Promise<void> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/files?ownerId=${ownerId}`
      );
      this.currentFiles = response.data.map((file: ServerFile) => ({
        ...file,
        createdAt: new Date(file.createdAt).toISOString(),
        updatedAt: new Date(file.updatedAt).toISOString(),
      }));
      this.store.set(`lastSync_${ownerId}`, Date.now());
    } catch (err) {
      console.error("Fetch files failed", err);
    }
  }

  getFiles(): FileItem[] {
    return this.filterType === "all"
      ? [...this.currentFiles]
      : this.currentFiles.filter((f) => f.fileName.endsWith(this.filterType));
  }

  addFile(file: FileItem) {
    this.currentFiles.push(file);
  }

  removeFile(fileId: string) {
    this.currentFiles = this.currentFiles.filter((f) => f.fileId !== fileId);
  }

  updateFile(file: FileItem) {
    const index = this.currentFiles.findIndex((f) => f.fileId === file.fileId);
    if (index !== -1) this.currentFiles[index] = file;
  }

  setFilterType(type: string) {
    this.filterType = type;
  }

  async uploadFile(file: File, ownerId: string, filePath: string) {
    const fileHash = await computeFileHash(file);
    const uploadedFiles = this.getUploadedFiles(ownerId);

    if (uploadedFiles[filePath] === fileHash) return; // already uploaded

    const now = new Date().toISOString();
    const fileObj = {
      ownerId,
      fileName: file.name,
      size: file.size,
      createdAt: now,
      updatedAt: now,
      mimeType: file.type,
      hash: fileHash,
    };

    const { data } = await axios.post(
      `${this.baseUrl}/files/upload-url`,
      fileObj
    );
    const { uploadUrl, fileId } = data;

    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
    });
    await axios.post(`${this.baseUrl}/files/mark-uploaded`, {
      ownerId,
      fileId,
    });

    const uploadedFile = { ...fileObj, fileId };
    this.addFile(uploadedFile);

    uploadedFiles[filePath] = fileHash;
    this.setUploadedFiles(ownerId, uploadedFiles);
  }

  async deleteFile(fileId: string, ownerId: string) {
    await axios.delete(
      `${this.baseUrl}/files/delete/${fileId}?ownerId=${ownerId}`
    );
    this.removeFile(fileId);

    const uploadedFiles = this.getUploadedFiles(ownerId);
    for (const key of Object.keys(uploadedFiles)) {
      if (key.endsWith(fileId)) delete uploadedFiles[key];
    }
    this.setUploadedFiles(ownerId, uploadedFiles);
  }

  async fetchDownloadUrl(fileId: string, ownerId: string) {
    const { data } = await axios.get(
      `${this.baseUrl}/files/download-url/${fileId}?ownerId=${ownerId}`
    );
    return data;
  }
}

export default new FileService();
