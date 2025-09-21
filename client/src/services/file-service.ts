import axios from "axios";
import { computeFileHash } from "../utils/file-utils";
import { FileItem, ServerFile, SyncResponse } from "../types";
import { addFileRow, removeFileRow, updateFileRow } from "../utils/table-utils";
// import path from "path";

const API_BASE_URL = "http://localhost:4001";

const getUploadedFilesKey = (userId: string) => `uploadedFiles_${userId}`;

class FileService {
  private currentFiles: FileItem[] = [];
  private filterType = "all";
  private baseUrl = API_BASE_URL;
  private store = window.electronStore;

  // Get the user's uploaded files hash map from store
  private getUploadedFiles(ownerId: string) {
    return (this.store.get(getUploadedFilesKey(ownerId)) || {}) as Record<
      string,
      string
    >;
  }

  // Save the user's uploaded files hash map to store
  private setUploadedFiles(
    ownerId: string,
    uploadedFiles: Record<string, string>
  ) {
    console.log("Setting cache as", uploadedFiles);
    this.store.set(getUploadedFilesKey(ownerId), uploadedFiles);
  }

  async fetchFiles(ownerId: string): Promise<void> {
    const now = Date.now();
    try {
      const response = await axios.get(
        `${this.baseUrl}/files?ownerId=${encodeURIComponent(ownerId)}`
      );

      this.currentFiles = response.data.map((file: ServerFile) => ({
        ...file,
        createdAt: new Date(file.createdAt).toISOString(),
        modifiedAt: new Date(file.modifiedAt).toISOString(),
      }));

      // Update last sync
      this.store.set(`lastSync_${ownerId}`, now);
      console.log("Setting cache as lastSync_: ", now);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  }

  getFiles(): FileItem[] {
    if (this.filterType === "all") return [...this.currentFiles];
    return this.currentFiles.filter((f) =>
      f.fileName.endsWith(this.filterType)
    );
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
    try {
      const now = new Date().toISOString();
      const fileHash = await computeFileHash(file);
      const uploadedFiles = this.getUploadedFiles(ownerId);

      // Check if already uploaded
      if (filePath && uploadedFiles[filePath] === fileHash) {
        console.log(
          `[FileService] Skipping already uploaded file: ${file.name}`
        );
        return;
      }

      const fileObj = {
        ownerId,
        size: file.size,
        fileName: file.name,
        createdAt: now,
        modifiedAt: now,
        mimeType: file.type,
        hash: fileHash,
      };

      const response = await axios.post(
        `${this.baseUrl}/files/upload-url`,
        fileObj
      );
      const { uploadUrl, fileId } = response.data;

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });
      await axios.post(`${this.baseUrl}/files/mark-uploaded`, {
        ownerId,
        fileId,
      });

      const uploadedFile = { ...fileObj, fileId };
      this.addFile(uploadedFile);

      this.store.set(getUploadedFilesKey(ownerId), uploadedFiles);
      console.log("Setting cache as", uploadedFiles);

      // Save hash in store if filePath provided
      const syncFolderPath = window.electronStore.get(`syncFolder_${ownerId}`);
      const syncFilePath = window.fsApi.joinPath(
        syncFolderPath,
        window.fsApi.basename(filePath)
      );
      uploadedFiles[filePath] = fileHash;
      uploadedFiles[syncFilePath] = fileHash;
      this.setUploadedFiles(ownerId, uploadedFiles);

      const tbody =
        document.querySelector<HTMLTableSectionElement>("#fileTableBody");
      if (tbody) addFileRow(uploadedFile, tbody);

      console.log(`Uploaded: ${file.name}`);
      return true;
    } catch (err) {
      console.error("Upload failed:", err);
    }
    return false;
  }

  async deleteFile(fileId: string, ownerId: string, skipConfirm?: boolean) {
    const file = this.currentFiles.find((f) => f.fileId === fileId);
    if (!file) return;

    if (!skipConfirm && !window.confirm(`Delete ${file.fileName}?`)) return;

    try {
      // Delete from backend
      await axios.delete(
        `${this.baseUrl}/files/delete/${fileId}?ownerId=${encodeURIComponent(
          ownerId
        )}`
      );

      this.removeFile(fileId);

      // Remove from cache: iterate over all keys and delete matching entries
      const uploadedFiles = this.getUploadedFiles(ownerId);
      for (const key of Object.keys(uploadedFiles)) {
        const cachedHash = uploadedFiles[key];
        if (key.endsWith(file.fileName)) {
          delete uploadedFiles[key];
        }
      }
      this.setUploadedFiles(ownerId, uploadedFiles);

      // Remove from UI
      const tbody =
        document.querySelector<HTMLTableSectionElement>("#fileTableBody");
      if (tbody) removeFileRow(file.fileName);

      // Delete from sync folder
      const syncFolder = window.electronStore.get(`syncFolder_${ownerId}`) as
        | string
        | undefined;

      if (syncFolder) {
        const syncFilePath = window.fsApi.joinPath(syncFolder, file.fileName);
        const exists = await window.fsApi.exists(syncFilePath);
        if (exists) {
          const result = await window.fsApi.deleteFile(syncFilePath);
          if (result.success) {
            console.log(
              `[FileService] Deleted from sync folder: ${syncFilePath}`
            );
          } else {
            console.error(
              `[FileService] Failed to delete from sync folder: ${syncFilePath}`,
              result.error
            );
          }
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  async syncFiles(ownerId: string): Promise<SyncResponse> {
    try {
      const lastSync = this.store.get(`lastSync_${ownerId}`) || null;
      const response = await axios.get(
        `${this.baseUrl}/sync/changes?ownerId=${ownerId}&since=${lastSync}`
      );

      const changes: SyncResponse = response.data;
      this.store.set(`lastSync_${ownerId}`, changes.lastSync);
      console.log("Setting cache as lastSync ", changes.lastSync);

      const tbody =
        document.querySelector<HTMLTableSectionElement>("#fileTableBody");
      if (tbody) {
        for (const added of changes.added || [])
          this.addFileRowSafe(added, tbody);
        for (const modified of changes.modified || [])
          this.updateFileRowSafe(modified, tbody);
        for (const removed of changes.removed || [])
          removeFileRow(removed.fileName);
      }

      return changes;
    } catch (err) {
      console.error("Sync failed:", err);
      throw err;
    }
  }

  private addFileRowSafe(file: FileItem, tbody: HTMLTableSectionElement) {
    if (!this.currentFiles.find((f) => f.fileId === file.fileId)) {
      this.addFile(file);
      addFileRow(file, tbody);
    }
  }

  private updateFileRowSafe(file: FileItem, tbody: HTMLTableSectionElement) {
    const row = tbody.querySelector<HTMLTableRowElement>(
      `tr[data-fileid="${CSS.escape(file.fileId)}"]`
    );
    if (row) {
      this.updateFile(file);
      updateFileRow(file, row);
    } else this.addFileRowSafe(file, tbody);
  }

  async fetchDownloadUrl(fileId: string, ownerId: string) {
    try {
      const response = await axios.get(
        `${
          this.baseUrl
        }/files/download-url/${fileId}?ownerId=${encodeURIComponent(ownerId)}`
      );
      return response.data;
    } catch (err) {
      console.error("Failed to fetch download URL:", err);
      throw err;
    }
  }
}

export default new FileService();
