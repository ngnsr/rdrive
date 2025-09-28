import { useEffect, useState } from "react";
import FileUpload from "../components/FileUpload";
import FileTable from "../components/FileTable";
import fileService from "../services/fileService";
import type { FileItem } from "../types";

// --- Filter Select Component ---
function FilterSelect({
  filter,
  onChange,
}: {
  filter: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <select
      value={filter}
      onChange={onChange}
      className="bg-white border px-3 py-2 rounded text-sm shadow-sm"
    >
      <option value="all">All Files</option>
      <option value=".java">.java Files</option>
      <option value=".png">.png Files</option>
      <option value=".jpg">.jpg Files</option>
    </select>
  );
}

// --- Refresh Button ---
function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
    >
      Refresh
    </button>
  );
}

// --- Upload Button ---
function UploadButton({
  ownerId,
  onUploadSuccess,
}: {
  ownerId: string;
  onUploadSuccess: (newFile: FileItem) => void;
}) {
  return <FileUpload ownerId={ownerId} onUploadSuccess={onUploadSuccess} />;
}

// --- Column Menu Component ---
function ColumnMenu() {
  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState({
    size: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true,
  });

  const toggleColumn = (col: keyof typeof columns) => {
    setColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 text-sm"
        title="Edit Columns"
      >
        ✏️
      </button>

      {open && (
        <div className="absolute mt-2 right-0 bg-white rounded shadow-lg border p-3 text-sm z-50 w-56">
          <div className="font-semibold mb-2">Toggle Columns</div>
          {Object.entries(columns).map(([col, checked]) => (
            <label key={col} className="block">
              <input
                type="checkbox"
                className="col-toggle"
                data-col={col}
                checked={checked}
                onChange={() => toggleColumn(col as keyof typeof columns)}
              />
              <span className="ml-2">{col}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Account Popup ---
function AccountPopup() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="border rounded px-2 py-1"
      >
        examplemail8374@gmail.com
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border shadow-md rounded p-2 flex flex-col">
          <button className="text-left px-2 py-1 hover:bg-gray-100 rounded">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// --- Main FilesPage ---
export default function FilesPage({ ownerId }: { ownerId: string }) {
  const [filter, setFilter] = useState("all");
  const [files, setFiles] = useState(fileService.getFiles());

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
  };

  const refresh = async () => {
    await fileService.fetchFiles(ownerId);
    setFiles([...fileService.getFiles()]);
  };

  const handleUploadSuccess = (newFile: FileItem) => {
    setFiles((prev) => [...prev, newFile]);
  };

  const handleDelete = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
  };

  useEffect(() => {
    refresh();
  }, [ownerId]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {/* Top Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FilterSelect filter={filter} onChange={handleFilterChange} />
          <RefreshButton onClick={refresh} />
          <UploadButton
            ownerId={ownerId}
            onUploadSuccess={handleUploadSuccess}
          />
          <ColumnMenu />
        </div>

        <AccountPopup />
      </div>

      {/* File Table */}
      <section className="bg-white shadow-md rounded-lg p-4">
        <FileTable
          ownerId={ownerId}
          files={files}
          filter={filter}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}
