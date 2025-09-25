interface Window {
  env: {
    getApiBaseUrl: () => string;
  };
  store: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
  };
}
