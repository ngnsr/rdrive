import { contextBridge, ipcRenderer } from "electron";
import { register, login, logout, getUser, confirm } from "./auth/auth";
import "./auth/amplify-config";
import { configureAmplify } from "./auth/amplify-config";
import fs from "fs";

interface AuthAPI {
  register: (email: string, password: string, name: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  getUser: () => Promise<any>;
  confirm: () => Promise<any>;
}

// Initialize and expose APIs
async function initialize() {
  try {
    // Load environment variables via IPC
    const env = await ipcRenderer.invoke("get-env-vars");

    // Set process.env for Amplify configuration
    process.env.COGNITO_USER_POOL_ID = env.COGNITO_USER_POOL_ID;
    process.env.COGNITO_CLIENT_ID = env.COGNITO_CLIENT_ID;
    process.env.AWS_REGION = env.AWS_REGION || "us-east-1";
    process.env.API_BASE_URL = env.API_BASE_URL || "http://localhost:3000";

    // Validate environment variables
    if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
      console.error("Preload: Missing required environment variables:", {
        userPoolId: !!process.env.COGNITO_USER_POOL_ID,
        clientId: !!process.env.COGNITO_CLIENT_ID,
      });
      throw new Error("Missing COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID");
    }
    configureAmplify(process.env);

    // Expose auth functions from auth.ts
    contextBridge.exposeInMainWorld("Auth", {
      register: async (email: string, password: string, name: string) => {
        try {
          const result = await register(email, password, name);
          return result;
        } catch (err) {
          console.error("Preload: Register error:", err);
          throw err;
        }
      },
      login: async (email: string, password: string) => {
        try {
          const result = await login(email, password);
          return result;
        } catch (err) {
          console.error("Preload: Login error:", err);
          throw err;
        }
      },
      logout: async () => {
        try {
          await logout();
        } catch (err) {
          console.error("Preload: Logout error:", err);
          throw err;
        }
      },
      getUser: async () => {
        try {
          const user = await getUser();
          return user;
        } catch (err) {
          console.error("Preload: Get user error:", err);
          throw err;
        }
      },
      confirm: async (email: string, code: string) => {
        try {
          const result = await confirm(email, code);
          return result;
        } catch (err) {
          console.error("Preload: Confirmation error:", err);
          throw err;
        }
      },
    } as AuthAPI);
    contextBridge.exposeInMainWorld("electronFs", {
      readFile: (path: string) => fs.readFileSync(path),
      writeFile: (path: string, data: any) => fs.writeFileSync(path, data),
    });
    contextBridge.exposeInMainWorld("electronApi", {
      selectFolder: async () => ipcRenderer.invoke("select-folder"),
      startFolderSync: (folderPath: string, userId: string) =>
        ipcRenderer.send("start-folder-sync", { folderPath, userId }),
    });
    contextBridge.exposeInMainWorld("env", {
      API_BASE_URL: process.env.API_BASE_URL,
    });
  } catch (err) {
    console.error("Preload initialization failed:", err);
    throw err;
  }
}

initialize();
