import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { configureAmplify } from "./auth/amplify-config";
import Store from "electron-store";
import * as auth from "./auth/auth";
import path from "path";

const store = new Store();

async function initializePreload() {
  try {
    const env = await ipcRenderer.invoke("get-env-vars");

    process.env.COGNITO_USER_POOL_ID = env.COGNITO_USER_POOL_ID;
    process.env.COGNITO_CLIENT_ID = env.COGNITO_CLIENT_ID;
    process.env.AWS_REGION = env.AWS_REGION || "us-east-1";

    if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
      throw new Error("Missing COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID");
    }

    configureAmplify(process.env);

    // Expose auth functions to renderer
    contextBridge.exposeInMainWorld("Auth", {
      register: auth.register,
      login: auth.login,
      logout: auth.logout,
      getUser: auth.getUser,
      confirm: auth.confirm,
    });

    // Expose env API
    contextBridge.exposeInMainWorld("env", {
      getApiBaseUrl: async () => {
        return await ipcRenderer.invoke("get-api-base-url");
      },
    });

    contextBridge.exposeInMainWorld("electronStore", {
      get: (key: string) => store.get(key),
      set: (key: string, value: any) => store.set(key, value),
      delete: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });

    contextBridge.exposeInMainWorld("electronApi", {
      selectFolder: async () => ipcRenderer.invoke("select-folder"),
      selectFile: async () => ipcRenderer.invoke("select-file"),
      startFolderSync: (folderPath: string, userId: string) =>
        ipcRenderer.send("start-folder-sync", { folderPath, userId }),
      onFileDeleted: (
        callback: (
          event: any,
          args: { fileName: string; ownerId: string; askConfirm?: boolean }
        ) => void
      ) => {
        ipcRenderer.on("file-deleted", callback);
      },
      onFileUploaded: (
        callback: (
          event: any,
          args: {
            fileName: string;
            ownerId: string;
            filePath: string;
          }
        ) => void
      ) => {
        ipcRenderer.on("file-uploaded", callback);
      },
      copyToSyncFolder: (filePath: string, syncFolder: string) =>
        ipcRenderer.invoke("copy-to-sync-folder", {
          filePath,
          syncFolder,
        }),
    });

    contextBridge.exposeInMainWorld("fsApi", {
      exists: async (filePath: string) =>
        ipcRenderer.invoke("fs-exists", filePath),
      joinPath: (...segments: string[]) => path.join(...segments),
      basename: (filePath: string) => path.basename(filePath),
      normalizePath: (p: string) => path.normalize(p),
      readFile: (filePath: string) =>
        ipcRenderer.invoke("fs-readFile", filePath),
      deleteFile: async (filePath: string) =>
        ipcRenderer.invoke("fs-unlink", filePath),
      getFilePath: (file: File) => file.path,
    });
  } catch (err) {
    console.error("Preload initialization failed:", err);
  }
}

initializePreload();
