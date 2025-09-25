import { useEffect, useState } from "react";
import fileService from "../services/FileService";
import type { FileItem } from "../types";

export default function FileTable({ ownerId }: { ownerId: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);

  const refresh = () => setFiles([...fileService.getFiles()]);

  useEffect(() => {
    fileService.fetchFiles(ownerId).then(refresh);
  }, [ownerId]);

  const handleDownload = async (fileId: string) => {
    const { downloadUrl } = await fileService.fetchDownloadUrl(fileId, ownerId);
    window.open(downloadUrl, "_blank");
  };

  const handleDelete = async (fileId: string) => {
    await fileService.deleteFile(fileId, ownerId);
    refresh();
  };

  return (
    <table className="table-auto w-full border">
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <tr key={file.fileId}>
            <td>{file.fileName}</td>
            <td>{(file.size / 1024).toFixed(2)} KB</td>
            <td className="flex gap-2">
              <button
                onClick={() => handleDownload(file.fileId)}
                className="btn"
              >
                Download
              </button>
              <button
                onClick={() => handleDelete(file.fileId)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
