import axios from "axios";
import { computeFileHash } from "../utils/file-utils";
import { FileItem, ServerFile, SyncResponse } from "../types";
import { addFileRow, removeFileRow, updateFileRow } from "../utils/table-utils";

const API_BASE_URL = window.env.API_BASE_URL;

class FileService {
  private currentFiles: FileItem[] = [];
  private filterType = "all";
  private baseUrl = API_BASE_URL;

  async fetchFiles(ownerId: string): Promise<void> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/files?ownerId=${encodeURIComponent(ownerId)}`
      );

      this.currentFiles = response.data.map((file: ServerFile) => ({
        ...file,
        createdAt: new Date(file.createdAt).toISOString(),
        modifiedAt: new Date(file.modifiedAt).toISOString(),
      }));
    } catch (error) {
      console.error("Failed to fetch files:", error);
      alert("Failed to sync with server. Check the console.");
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

  async uploadFile(file: File, ownerId: string) {
    try {
      const now = new Date().toISOString();
      const fileHash = await computeFileHash(file);

      const fileObj = {
        ownerId,
        fileName: file.name,
        size: file.size,
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

      // Safely render row
      const tbody =
        document.querySelector<HTMLTableSectionElement>("#fileTableBody");
      if (tbody) addFileRow(uploadedFile, tbody);

      console.log(`Uploaded: ${file.name}`);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check console.");
    }
  }

  async deleteFileByName(fileName: string, ownerId: string) {
    const file = this.currentFiles.find((f) => f.fileName === fileName);
    if (!file) return;
    return this.deleteFile(file.fileId, ownerId);
  }

  async deleteFile(fileId: string, ownerId: string) {
    const file = this.currentFiles.find((f) => f.fileId === fileId);
    if (!file) return;

    if (!window.confirm(`Delete ${file.fileName}?`)) return;

    try {
      await axios.delete(
        `${this.baseUrl}/files/delete/${fileId}?ownerId=${encodeURIComponent(
          ownerId
        )}`
      );
      this.removeFile(fileId);

      const tbody =
        document.querySelector<HTMLTableSectionElement>("#fileTableBody");
      if (tbody) removeFileRow(file.fileName);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed. Check console.");
    }
  }

  async syncFiles(ownerId: string): Promise<SyncResponse> {
    try {
      const lastSync = localStorage.getItem("lastSync") || null;
      const response = await axios.get(
        `${this.baseUrl}/sync/changes?ownerId=${ownerId}&since=${lastSync}`
      );

      const changes: SyncResponse = response.data;
      localStorage.setItem("lastSync", changes.lastSync);

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
