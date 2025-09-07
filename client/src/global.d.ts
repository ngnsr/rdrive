export {};

declare global {
  interface Window {
    electronAPI: {
      uploadFile: (filePath: string) => Promise<any>;
      deleteFile: (fileName: string) => Promise<any>;
      fetchFiles: () => Promise<any>;
    };
    Auth: {
      register: (email: string, password: string, name: string) => Promise<any>;
      login: (email: string, password: string) => Promise<any>;
      logout: () => Promise<void>;
      getUser: () => Promise<any>;
      confirm: (email: string, code: string) => Promise<any>;
    };
  }
}
