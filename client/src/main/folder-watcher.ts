import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import mime from "mime";
import axios from "axios";
import crypto from "crypto";

interface WatcherOptions {
  folderPath: string;
  userId: string;
}

export function startFolderWatcher({ folderPath, userId }: WatcherOptions) {
  console.log(`[Watcher] Starting folder watcher on: ${folderPath}`);

  const watcher = chokidar.watch(folderPath, {
    persistent: true,
    ignoreInitial: false,
    depth: 0, // watch only root
  });

  // Node buffer hash
  async function computeBufferHash(buffer: Buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  const uploadFileNode = async (filePath: string) => {
    const fileName = path.basename(filePath);

    try {
      console.log(`[Watcher] Detected change/add: ${fileName}, uploading...`);

      // Read file as Buffer
      const buffer = fs.readFileSync(filePath);

      // Detect MIME type
      const mimeType = mime.getType(filePath) || "application/octet-stream";

      const now = new Date().toISOString();
      const fileHash = await computeBufferHash(buffer);

      const fileObj = {
        ownerId: userId,
        fileName,
        size: buffer.byteLength,
        createdAt: now,
        modifiedAt: now,
        mimeType,
        hash: fileHash,
      };

      // Step 1: Get signed S3 URL
      const { uploadUrl, fileId } = (
        await axios.post("http://localhost:3000/files/upload-url", fileObj)
      ).data;

      // Step 2: Upload to S3
      await axios.put(uploadUrl, buffer, {
        headers: { "Content-Type": mimeType },
      });

      // Step 3: Mark uploaded
      await axios.post("http://localhost:3000/files/mark-uploaded", {
        ownerId: userId,
        fileId,
      });

      console.log(`[Watcher] Upload complete: ${fileName}`);
    } catch (err) {
      console.error(`[Watcher] Upload failed for ${fileName}:`, err);
    }
  };

  const deleteFileNode = async (filePath: string) => {
    const fileName = path.basename(filePath);
    try {
      console.log(
        `[Watcher] Detected deletion: ${fileName}, removing remote...`
      );
      //   await fileService.deleteFileByName(fileName, userId);
      console.log(`[Watcher] Remote deletion complete: ${fileName}`);
    } catch (err) {
      console.error(`[Watcher] Remote deletion failed: ${fileName}`, err);
    }
  };

  watcher
    .on("add", uploadFileNode)
    .on("change", uploadFileNode)
    .on("unlink", deleteFileNode);

  return watcher;
}
