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
      startFolderSync: (folderPath: string, userId: string) => void;
    };
    electronFs?: {
      readFile: (path: string) => Buffer;
      writeFile: (path: string, data: any) => void;
    };
    env: {
      API_BASE_URL: string;
    };
  }
}
