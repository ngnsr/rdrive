// Mocks for window in Jest (jsdom)
Object.defineProperty(window, "env", {
  value: {
    getApiBaseUrl: () => "http://localhost:4001",
  },
});

Object.defineProperty(window, "electronStore", {
  value: {
    get: jest.fn(),
    set: jest.fn(),
  },
});

Object.defineProperty(window, "fsApi", {
  value: {
    joinPath: (a: string, b: string) => `${a}/${b}`,
    basename: (path: string) => path.split("/").pop(),
    exists: jest.fn().mockResolvedValue(true),
    deleteFile: jest.fn().mockResolvedValue({ success: true }),
  },
});
