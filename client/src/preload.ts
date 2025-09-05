const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script loaded");

contextBridge.exposeInMainWorld("electronAPI", {
  uploadFile: (filePath: string) => ipcRenderer.invoke("upload-file", filePath),
  deleteFile: (fileName: string) => ipcRenderer.invoke("delete-file", fileName),
  fetchFiles: () => ipcRenderer.invoke("fetch-files"),
});
