// ------------------ MOCKS ------------------

// Mock axios api
jest.mock("../api/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
}));
import api from "../api/api";

// Mock file hash util before importing FileService
jest.mock("../utils/file-utils", () => ({
  computeFileHash: jest.fn(async (file) => "mock-hash"),
}));

// Mock table utils
jest.mock("../utils/table-utils", () => ({
  addFileRow: jest.fn(),
  removeFileRow: jest.fn(),
  updateFileRow: jest.fn(),
}));
import * as TableUtils from "../utils/table-utils";

import FileService from "./file-service";
import { FileItem } from "../types";
import axios from "axios";

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock DOM
document.body.innerHTML = `<table><tbody id="fileTableBody"></tbody></table>`;

// ------------------ TESTS ------------------

describe("FileService", () => {
  const ownerId = "owner-123";
  const testFile: FileItem = {
    fileId: "file-1",
    ownerId,
    fileName: "test.txt",
    size: 10,
    mimeType: "text/plain",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hash: "hash",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    FileService["currentFiles"] = [];
  });

  test("should add a file", () => {
    FileService.addFile(testFile);
    expect(FileService.getFiles()).toHaveLength(1);
    expect(FileService.getFiles()[0].fileId).toBe("file-1");
  });

  test("should remove a file", () => {
    FileService.addFile(testFile);
    FileService.removeFile("file-1");
    expect(FileService.getFiles()).toHaveLength(0);
  });

  test("should update a file", () => {
    FileService.addFile(testFile);
    const updated = { ...testFile, fileName: "updated.txt" };
    FileService.updateFile(updated);
    expect(FileService.getFiles()[0].fileName).toBe("updated.txt");
  });

  test("should set filter type", () => {
    FileService.setFilterType("txt");
    expect(FileService["filterType"]).toBe("txt");
  });

  test("getFiles respects filterType", () => {
    const ownerId = "owner-123";

    // Reset state
    FileService["currentFiles"] = [];
    FileService.setFilterType("all");

    const txtFile: FileItem = {
      fileId: "file-1",
      ownerId,
      fileName: "document.txt",
      size: 100,
      mimeType: "text/plain",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hash: "hash1",
    };

    const jpgFile: FileItem = {
      fileId: "file-2",
      ownerId,
      fileName: "image.jpg",
      size: 200,
      mimeType: "image/jpeg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hash: "hash2",
    };

    // Add files
    FileService.addFile(txtFile);
    FileService.addFile(jpgFile);

    // Default filterType is "all"
    let files = FileService.getFiles();
    expect(files).toHaveLength(2);

    // Set filter to txt files
    FileService.setFilterType("txt");
    files = FileService.getFiles();
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("document.txt");

    // Set filter to jpg files
    FileService.setFilterType("jpg");
    files = FileService.getFiles();
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("image.jpg");

    // Set filter to something that doesn't exist
    FileService.setFilterType("pdf");
    files = FileService.getFiles();
    expect(files).toHaveLength(0);

    // Reset to all
    FileService.setFilterType("all");
    files = FileService.getFiles();
    expect(files).toHaveLength(2);
  });

  test("uploadFile calls API and updates currentFiles", async () => {
    // Mock POST to get upload URL
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { fileId: "file-1", uploadUrl: "http://mock.url" },
    });

    // Mock PUT to upload URL
    mockedAxios.put.mockResolvedValueOnce({ status: 200 });

    // Mock POST to mark-uploaded
    (api.post as jest.Mock).mockResolvedValueOnce({});

    const file = new File(["content"], "test.txt", { type: "text/plain" });

    const result = await FileService.uploadFile(
      file,
      "owner-123",
      "/path/test.txt"
    );

    expect(result).toBe(true);
    expect(FileService.getFiles()).toHaveLength(1);
    expect(TableUtils.addFileRow).toHaveBeenCalled();
  });

  test("deleteFile removes file and updates store", async () => {
    FileService.addFile(testFile);
    (api.delete as jest.Mock).mockResolvedValueOnce({});
    (window.fsApi.exists as jest.Mock).mockResolvedValueOnce(false);

    await FileService.deleteFile("file-1", ownerId, true);

    expect(FileService.getFiles()).toHaveLength(0);
    expect(TableUtils.removeFileRow).toHaveBeenCalled();
  });

  test("fetchDownloadUrl calls API", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { fileId: "file-1", downloadUrl: "http://mock.url" },
    });
    const result = await FileService.fetchDownloadUrl("file-1", ownerId);
    expect(result.downloadUrl).toBe("http://mock.url");
  });
});
