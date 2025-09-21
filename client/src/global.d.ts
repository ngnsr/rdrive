export {};

declare global {
  interface Window {
    Auth: {
      register: (email: string, password: string, name: string) => Promise<any>;
      login: (email: string, password: string) => Promise<any>;
      logout: () => Promise<void>;
      getUser: () => Promise<any>;
      confirm: (email: string, code: string) => Promise<any>;
    };
    currentUser: { loginId: string } | null;
    setCurrentUser: (user: { loginId: string } | null) => void;
    electronApi: {
      selectFolder: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      selectFile: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      startFolderSync: (folderPath: string, userId: string) => void;
      onFileDeleted: (
        callback: (
          _event: any,
          args: {
            fileName: string;
            ownerId: string;
            skipConfirm?: boolean;
          }
        ) => void
      ) => void;
      onFileUploaded: (
        callback: (
          event: any,
          args: {
            fileName: string;
            ownerId: string;
            filePath?: string;
          }
        ) => void
      ) => void;
      copyToSyncFolder: (
        filePath: string,
        syncFolder: string
      ) => Promise<string>;
    };
    env: {
      getApiBaseUrl: () => string;
    };
    electronStore: {
      get: (key: string) => any;
      set: (key: string, value: any) => void;
      delete: (key: string) => void;
      clear: () => void;
    };
    fsApi: {
      getFilePath: (file: File) => string;
      joinPath: (...segments: string[]) => string;
      basename: (filePath: string) => string;
      normalizePath: (p: string) => string;
      readFile: (filePath: string) => Promise<FileData>;
      writeFile: (filePath: string, content: string) => Promise<void>;
      exists: (filePath: string) => Promise<boolean>;
      deleteFile: (
        filePath: string
      ) => Promise<{ success: boolean; error?: string }>;
    };
    API_BASE_URL: string;
  }
}
