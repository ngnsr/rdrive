import axios from "axios";
import { addFileRow, removeFileRow } from "../utils/table-utils";
import { computeFileHash } from "../utils/file-utils";
import { FileItem, ServerFile, SyncResponse } from "../types";

class FileService {
  private currentFiles: FileItem[] = [];
  private filterType = "all";

  async fetchFiles(ownerId: string): Promise<void> {
    try {
      const response = await axios.get(
        `http://localhost:3000/files?ownerId=${encodeURIComponent(ownerId)}`
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
    if (this.filterType === "all") {
      return [...this.currentFiles];
    }
    return this.currentFiles.filter((file) =>
      file.fileName.endsWith(this.filterType)
    );
  }

  addFile(file: FileItem) {
    this.currentFiles.push(file);
  }

  removeFile(fileId: string) {
    this.currentFiles = this.currentFiles.filter((f) => f.fileId !== fileId);
  }

  setFilterType(type: string): void {
    this.filterType = type;
  }

  async uploadFile(file: File, ownerId: string): Promise<void> {
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

      // Request presigned URL
      const response = await axios.post(
        "http://localhost:3000/files/upload-url",
        fileObj
      );

      const { uploadUrl, fileId } = response.data;

      // Upload file directly to S3
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });

      // Notify backend upload completed
      await axios.post("http://localhost:3000/files/mark-uploaded", {
        ownerId,
        fileId,
      });

      // --- Add fileId to object for table / in-memory store ---
      const uploadedFile = { ...fileObj, fileId };

      // Add to fileService memory
      this.addFile(uploadedFile);

      // Render the row in the table
      const appContainer = document.getElementById("app");
      const tbody = appContainer?.querySelector("tbody");
      if (tbody) {
        addFileRow(uploadedFile, tbody as HTMLElement);
      }

      alert("File uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check the console for details.");
    }
  }

  async deleteFile(fileId: string, ownerId: string): Promise<void> {
    const serverFile = this.currentFiles.find((file) => file.fileId === fileId);
    if (!serverFile) return;

    if (
      !window.confirm(`Are you sure you want to delete ${serverFile.fileName}?`)
    )
      return;

    try {
      // Call backend to delete by fileId
      const response = await axios.delete(
        `http://localhost:3000/files/delete/${fileId}?ownerId=${encodeURIComponent(
          ownerId
        )}`
      );
      alert(response.data.message);

      // Remove from currentFiles state
      this.removeFile(fileId);
      removeFileRow(serverFile.fileName);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed. Check the console for details.");
    }
  }

  async syncFiles(ownerId: string): Promise<SyncResponse> {
    try {
      const lastSync = localStorage.getItem("lastSync") || null;
      const response = await axios.get(
        `http://localhost:3000/sync/changes?ownerId=${ownerId}&since=${lastSync}`
      );

      const changes: SyncResponse = response.data;
      localStorage.setItem("lastSync", changes.lastSync);

      return changes;
    } catch (err) {
      console.error("Sync failed:", err);
      throw err;
    }
  }

  async fetchDownloadUrl(
    fileId: string,
    ownerId: string
  ): Promise<{ downloadUrl: string }> {
    try {
      const response = await axios.get(
        `http://localhost:3000/files/download-url/${fileId}?ownerId=${encodeURIComponent(
          ownerId
        )}`
      );
      return response.data;
    } catch (err) {
      console.error("Failed to fetch download URL:", err);
      throw err;
    }
  }
}

export default new FileService();
