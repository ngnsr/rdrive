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
  }
}
