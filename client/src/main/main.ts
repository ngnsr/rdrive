import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { config } from "dotenv";

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
