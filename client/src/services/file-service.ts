import axios from "axios";
import { fetchFilesAndRenderTable } from "../utils/render-table";

export type FileItem = {
  name: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  owner: string;
  editor: string;
};

type ServerFile = {
  name: string;
  filename: string;
  uploadedAt: string;
  mtime: string;
};

class FileService {
  private currentFiles: FileItem[] = [];
  private sortAscending = true;
  private filterType = "all";

  async fetchFiles(): Promise<void> {
    throw new Error("Not implemented");
    // return;
    try {
      const response = await axios.get("http://localhost:3000/files");
      this.currentFiles = response.data.map((file: ServerFile) => ({
        name: file.name,
        createdAt: new Date(file.uploadedAt),
        modifiedAt: new Date(file.mtime),
        owner: "Unknown", // Placeholder
        editor: "Unknown", // Placeholder
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
      file.name.endsWith(this.filterType)
    );
  }

  // sortByModified(): void {
  //   this.currentFiles.sort((a, b) => {
  //     return this.sortAscending
  //       ? a.modifiedAt.getTime() - b.modifiedAt.getTime()
  //       : b.modifiedAt.getTime() - a.modifiedAt.getTime();
  //   });
  //   this.sortAscending = !this.sortAscending;
  // }

  setFilterType(type: string): void {
    this.filterType = type;
  }

  async uploadFile(file: File, ownerId: string): Promise<void> {
    try {
      // Step 1: Request presigned URL
      const response = await axios.post(
        "http://localhost:3000/files/upload-url",
        {
          fileName: file.name,
          ownerId,
          size: file.size,
          mimeType: file.type,
        }
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

      alert("File uploaded successfully!");
      await fetchFilesAndRenderTable({ loginId: ownerId }); // Refresh after upload
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check the console for details.");
    }
  }

  async deleteFile(fileToDelete: FileItem): Promise<void> {
    const serverFile = this.currentFiles.find(
      (file) => file.name === fileToDelete.name
    );
    if (
      serverFile &&
      window.confirm(`Are you sure you want to delete ${serverFile.name}?`)
    ) {
      try {
        const response = await axios.delete(
          `http://localhost:3000/files/delete/${serverFile.name}`
        );
        alert(response.data.message);
        await this.fetchFiles(); // todo: fix
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Delete failed. Check the console for details.");
      }
    }
  }
}

export default new FileService();
