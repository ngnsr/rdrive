import { app, BrowserWindow, dialog, ipcMain } from "electron";
import * as path from "path";
import { config } from "dotenv";
import { startFolderWatcher } from "./folder-watcher";
import Store from "electron-store";
import fs from "fs";
import mime from "mime";
import { User } from "../types";

const store = new Store<Record<string, unknown>>();

let mainWindow: BrowserWindow | null = null;
let currentWatcher: ReturnType<typeof startFolderWatcher> | null = null;

const envPath = path.resolve(__dirname, "../.env");
const env = config({ path: envPath });
if (env.error) {
  console.error("Failed to load .env file:", env.error);
}

ipcMain.handle("get-env-vars", async () => {
  return {
    API_BASE_URL: process.env.API_BASE_URL,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    AWS_REGION: process.env.AWS_REGION,
  };
});

// Environment variable handler
ipcMain.handle("get-api-base-url", async (event) => {
  return process.env.API_BASE_URL;
});

ipcMain.on("start-folder-sync", (event, { folderPath, userId }) => {
  if (currentWatcher) {
    currentWatcher.close();
    currentWatcher = null;
  }

  currentWatcher = startFolderWatcher({ folderPath, userId, store });

  currentWatcher.on("unlink", (filePath) => {
    const fileName = path.basename(filePath);
    const currentUser = store.get("currentUser") as User | undefined;
    const ownerId = currentUser?.loginId;

    if (!ownerId) {
      console.warn("No active user, skipping folder watcher events");
      return;
    }

    console.log(`[Watcher] File deleted: ${fileName}, sending IPC to renderer`);

    mainWindow?.webContents.send("file-deleted", {
      fileName,
      ownerId,
      skipConfirm: true,
    });
  });

  const handleFileChange = (filePath: string) => {
    const fileName = path.basename(filePath);
    const currentUser = store.get("currentUser") as User | undefined;
    const ownerId = currentUser?.loginId;

    if (!ownerId) {
      console.warn("No active user, skipping folder watcher events");
      return;
    }

    console.log(
      `[Watcher] File uploaded/changed: ${fileName}, sending IPC to renderer`
    );

    mainWindow?.webContents.send("file-uploaded", {
      fileName,
      ownerId,
      filePath,
    });
  };

  currentWatcher.on("add", handleFileChange).on("change", handleFileChange);
});

ipcMain.handle("select-folder", async () => {
  return dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
});

ipcMain.handle("select-file", async () => {
  return dialog.showOpenDialog({
    properties: ["openFile"],
  });
});

ipcMain.handle("fs-unlink", async (_event, filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return { success: true };
    }
    return { success: false, error: "File not found" };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
});

ipcMain.handle("fs-exists", async (_event, filePath: string) => {
  return fs.existsSync(filePath);
});

ipcMain.handle("fs-readFile", (_event, filePath: string) => {
  const buffer = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);
  const type = mime.getType(filePath) || "application/octet-stream";

  return {
    name: fileName,
    type,
    lastModified: stats.mtimeMs,
    size: buffer.byteLength,
    buffer: buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ),
  };
});

ipcMain.handle(
  "copy-to-sync-folder",
  async (_event, { filePath, syncFolder }) => {
    if (!syncFolder) throw new Error("Sync folder not set");
    const fileName = path.basename(filePath);
    const destPath = path.join(syncFolder, fileName);
    fs.copyFileSync(filePath, destPath);
    console.log(`[Main] Copied ${fileName} to sync folder`);
    return destPath;
  }
);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
