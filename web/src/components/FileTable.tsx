import { useEffect, useState } from "react";
import fileService from "../services/fileService";
import type { FileItem } from "../types";
import { FilePreview } from "./PreviewUtils";

interface FileTableProps {
  ownerId: string;
  files: FileItem[];
  filter: string;
  visibleCols: Record<string, boolean>;
  onDelete?: (fileId: string) => void;
}

export default function FileTable({
  ownerId,
  files,
  filter,
  visibleCols,
  onDelete,
}: FileTableProps) {
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const filteredFiles =
    filter === "all" ? files : files.filter((f) => f.fileName.endsWith(filter));

  const handleDownload = async (file: FileItem) => {
    try {
      const { downloadUrl } = await fileService.fetchDownloadUrl(
        file.fileId,
        ownerId
      );
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
      alert(`Failed to download ${file.fileName}`);
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Delete ${file.fileName}?`)) return;
    try {
      await fileService.deleteFile(file.fileId, ownerId, file.fileName);
      if (onDelete) onDelete(file.fileId); // notify parent to remove file from state
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
  };

  const columns = [
    { key: "fileName", label: "Name", sortable: true },
    { key: "size", label: "Size", sortable: true },
    { key: "createdAt", label: "Created At", sortable: true },
    { key: "updatedAt", label: "Updated At", sortable: true },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Updated By" },
  ];

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="table-fixed w-full text-sm text-left border">
        <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
          <tr>
            {columns.map(
              (col) =>
                visibleCols[col.key] && (
                  <th
                    key={col.key}
                    className="px-6 py-3 cursor-pointer relative"
                    onClick={() =>
                      col.sortable && console.log("Sort not implemented yet")
                    }
                  >
                    {col.label}
                    {col.sortable && (
                      <span className="sort-arrow absolute right-2"></span>
                    )}
                  </th>
                )
            )}
            <th className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredFiles.map((file) => (
            <tr
              key={file.fileId}
              className="hover:bg-gray-100 transition-colors"
            >
              {visibleCols.fileName && (
                <td className="border px-6 py-4">{file.fileName}</td>
              )}
              {visibleCols.size && (
                <td className="border px-6 py-4">
                  {(file.size / 1024).toFixed(2)} KB
                </td>
              )}
              {visibleCols.createdAt && (
                <td className="border px-6 py-4">
                  {new Date(file.createdAt).toLocaleDateString()}
                </td>
              )}
              {visibleCols.updatedAt && (
                <td className="border px-6 py-4">
                  {new Date(file.updatedAt).toLocaleDateString()}
                </td>
              )}
              {visibleCols.createdBy && (
                <td className="border px-6 py-4">{file.createdUser || "—"}</td>
              )}
              {visibleCols.updatedBy && (
                <td className="border px-6 py-4">{file.updatedUser || "—"}</td>
              )}
              <td className="border px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                  <button
                    onClick={() => handlePreview(file)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 w-full sm:w-auto"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full sm:w-auto"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 w-full sm:w-auto"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {previewFile && (
        <FilePreview
          file={previewFile}
          ownerId={ownerId}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
