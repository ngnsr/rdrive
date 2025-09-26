import { useEffect, useState } from "react";
import fileService from "../services/fileService";
import type { FileItem } from "../types";
// import { previewFile } from "../utils/previewUtils";

interface FileTableProps {
  ownerId: string;
  files: FileItem[];
  filter: string;
  onDelete?: (fileId: string) => void; // optional callback to update parent state
}

export default function FileTable({
  ownerId,
  files,
  filter,
  onDelete,
}: FileTableProps) {
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({});

  // Load visible columns from localStorage
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("rdrive.visibleCols") || "{}"
    );
    setVisibleCols({
      fileName: true,
      size: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
      ...saved,
    });
  }, []);

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
      await fileService.deleteFile(file.fileId, ownerId);
      if (onDelete) onDelete(file.fileId); // notify parent to remove file from state
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreview = async (file: FileItem) => {
    await previewFile(file.fileId, ownerId, file.fileName);
  };

  const toggleColumn = (col: string) => {
    setVisibleCols((prev) => {
      const updated = { ...prev, [col]: !prev[col] };
      localStorage.setItem("rdrive.visibleCols", JSON.stringify(updated));
      return updated;
    });
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
      <table className="table-auto w-full text-sm text-left border">
        <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-3 cursor-pointer relative ${
                  !visibleCols[col.key] ? "hidden" : ""
                }`}
                onClick={() =>
                  col.sortable && console.log("Sort not implemented yet")
                }
              >
                {col.label}
                {col.sortable && (
                  <span className="sort-arrow absolute right-2"></span>
                )}
              </th>
            ))}
            <th className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredFiles.map((file) => (
            <tr
              key={file.fileId}
              className="hover:bg-gray-100 transition-colors"
            >
              <td
                className={`border px-6 py-4 ${
                  !visibleCols.fileName ? "hidden" : ""
                }`}
              >
                {file.fileName}
              </td>
              <td
                className={`border px-6 py-4 ${
                  !visibleCols.size ? "hidden" : ""
                }`}
              >
                {(file.size / 1024).toFixed(2)} KB
              </td>
              <td
                className={`border px-6 py-4 ${
                  !visibleCols.createdAt ? "hidden" : ""
                }`}
              >
                {new Date(file.createdAt).toLocaleDateString()}
              </td>
              <td
                className={`border px-6 py-4 ${
                  !visibleCols.updatedAt ? "hidden" : ""
                }`}
              >
                {new Date(file.updatedAt).toLocaleDateString()}
              </td>
              <td
                className={`border px-6 py-4 ${
                  !visibleCols.createdBy ? "hidden" : ""
                }`}
              >
                {file.createdUser || "—"}
              </td>
              <td
                className={`border px-6 py-4 ${
                  !visibleCols.updatedBy ? "hidden" : ""
                }`}
              >
                {file.updatedUser || "—"}
              </td>
              <td className="border px-6 py-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreview(file)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
