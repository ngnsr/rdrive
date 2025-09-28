import { useState } from "react";
import fileService from "../services/fileService";
import type { FileItem } from "../types";

interface FileUploadProps {
  ownerId: string;
  onUploadSuccess?: (file: FileItem) => void;
}

export default function FileUpload({
  ownerId,
  onUploadSuccess,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const uploadedFile = await fileService.uploadFile(file, ownerId, file.name);
    if (uploadedFile && onUploadSuccess) {
      onUploadSuccess(uploadedFile);
    }
    setFile(null);
  };

  return (
    <div className="flex gap-2">
      <input type="file" onChange={handleChange} />
      <button onClick={handleUpload} className="btn btn-primary">
        Upload
      </button>
    </div>
  );
}
