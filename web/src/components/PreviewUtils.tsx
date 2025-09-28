import { useState, useEffect } from "react";
import fileService from "../services/fileService";
import type { FileItem } from "../types";

// Memory cache for preview blobs/URLs or text content
const previewCache: Record<
  string,
  { content: string | null; url: string | null; expires: number }
> = {};

interface FilePreviewProps {
  file: FileItem | null;
  ownerId: string;
  onClose: () => void;
}

export function FilePreview({ file, ownerId, onClose }: FilePreviewProps) {
  const [loading, setLoading] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;

    const fetchPreview = async () => {
      setLoading(true);
      const now = Date.now();

      // Check cache
      if (
        previewCache[file.fileId] &&
        previewCache[file.fileId].expires > now
      ) {
        const cache = previewCache[file.fileId];
        setImgUrl(cache.url);
        setTextContent(cache.content);
        setLoading(false);
        return;
      }

      try {
        const { downloadUrl } = await fileService.fetchDownloadUrl(
          file.fileId,
          ownerId
        );
        const response = await fetch(downloadUrl);
        const blob = await response.blob();

        let previewUrl: string | null = null;
        let content: string | null = null;

        if (file.fileName.match(/\.(png|jpg|jpeg)$/i)) {
          previewUrl = URL.createObjectURL(blob);
          setImgUrl(previewUrl);
          setTextContent(null);
        } else if (file.fileName.match(/\.(js|txt|json)$/i)) {
          content = await blob.text();
          setTextContent(content);
          setImgUrl(null);
        } else {
          setTextContent("Preview not supported for this file type.");
          setImgUrl(null);
        }

        previewCache[file.fileId] = {
          url: previewUrl,
          content,
          expires: now + 5 * 60 * 1000, // 5 min cache
        };
      } catch (err) {
        console.error("Preview failed:", err);
        setTextContent("Failed to load preview");
        setImgUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();

    // Cleanup object URLs
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [file, ownerId]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-3xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center border-b px-4 py-2">
          <h2 id="previewTitle" className="font-semibold">
            {file.fileName}
          </h2>
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={onClose}
          >
            ✖
          </button>
        </div>

        <div
          id="previewContent"
          className="p-4 flex justify-center items-center min-h-[200px]"
        >
          {loading && <div>Loading preview...</div>}
          {!loading && imgUrl && (
            <img
              src={imgUrl}
              alt={file.fileName}
              className="max-w-full max-h-[70vh]"
            />
          )}
          {!loading && textContent && (
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded w-full">
              {textContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to check if file can be previewed
export function canPreview(fileName: string) {
  return /\.(png|jpg|jpeg|txt|js|json)$/i.test(fileName);
}
