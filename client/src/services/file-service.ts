import axios from "axios";

export type FileItem = {
  name: string;
  createdAt: Date;
  modifiedAt: Date;
  owner: string;
  editor: string;
};

type ServerFile = {
  name: string;
  filename: string;
  uploadedAt: string;
  mtime: Date;
};

class FileService {
  private currentFiles: FileItem[] = [];
  private sortAscending = true;
  private filterType = "all";

  async fetchFiles(): Promise<void> {
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

  sortByModified(): void {
    this.currentFiles.sort((a, b) => {
      return this.sortAscending
        ? a.modifiedAt.getTime() - b.modifiedAt.getTime()
        : b.modifiedAt.getTime() - a.modifiedAt.getTime();
    });
    this.sortAscending = !this.sortAscending;
  }

  setFilterType(type: string): void {
    this.filterType = type;
  }

  async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:3000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert(response.data.message);
      await this.fetchFiles(); // Refresh after upload
    } catch (error) {
      console.error("Upload failed:", error);
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
          `http://localhost:3000/delete/${serverFile.name}`
        );
        alert(response.data.message);
        await this.fetchFiles(); // Refresh after deletion
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Delete failed. Check the console for details.");
      }
    }
  }
}

export default new FileService();
