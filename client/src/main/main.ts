import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { config } from "dotenv";
import fs from "fs";
const FILES_DIR = path.join(process.cwd(), "files");

let mainWindow: BrowserWindow | null = null;

const envPath = path.resolve(__dirname, "../.env");
const result = config({ path: envPath });
if (result.error) {
  console.error("Failed to load .env file:", result.error);
}

ipcMain.handle("get-env-vars", async () => {
  return {
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    AWS_REGION: process.env.AWS_REGION,
  };
});

// Fetch files
ipcMain.handle("fetch-files", async () => {
  try {
    const files = fs.readdirSync(FILES_DIR);
    return files.map((file) => {
      const stats = fs.statSync(path.join(FILES_DIR, file));
      return {
        name: file,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    });
  } catch (err) {
    console.error("Failed to fetch files:", err);
    throw err;
  }
});

// Upload file
ipcMain.handle("upload-file", async (_, filePath: string) => {
  try {
    const fileName = path.basename(filePath);
    const dest = path.join(FILES_DIR, fileName);
    fs.copyFileSync(filePath, dest);
    return { success: true, name: fileName };
  } catch (err) {
    console.error("Failed to upload file:", err);
    throw err;
  }
});

// Delete file
ipcMain.handle("delete-file", async (_, fileName: string) => {
  try {
    const filePath = path.join(FILES_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    } else {
      throw new Error("File does not exist");
    }
  } catch (err) {
    console.error("Failed to delete file:", err);
    throw err;
  }
});

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
