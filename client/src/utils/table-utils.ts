import fileService from "../services/file-service";
import { previewFile } from "./preview-utils";
import { FileItem } from "../types";

export function addFileRow(file: FileItem, tbody: HTMLElement) {
  if (!tbody) return;
  const newRow = document.createElement("tr");
  newRow.className = "hover:bg-gray-100 transition-colors";
  newRow.setAttribute("data-fileid", file.fileId);
  newRow.setAttribute("data-filename", file.fileName);

  // Use existing HTML headers; just fill cells
  newRow.innerHTML = `
    <td class="border border-gray-300 px-8 py-4">${file.fileName}</td>
    <td class="border border-gray-300 px-8 py-4">${formatSize(file.size)}</td>
    <td class="border border-gray-300 px-8 py-4">${new Date(
      file.createdAt
    ).toLocaleDateString()}</td>
    <td class="border border-gray-300 px-8 py-4">${new Date(
      file.modifiedAt
    ).toLocaleDateString()}</td>
    <td class="border border-gray-300 px-8 py-4">
      <button class="preview-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2">
        Preview
      </button>
      <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
        Delete
      </button>
    </td>
  `;

  tbody.appendChild(newRow);
  wireRowEvents(newRow, file);
}

export function updateFileRow(file: FileItem, row: HTMLElement) {
  row.innerHTML = `
    <td class="border border-gray-300 px-8 py-4">${file.fileName}</td>
    <td class="border border-gray-300 px-8 py-4">${formatSize(file.size)}</td>
    <td class="border border-gray-300 px-8 py-4">${new Date(
      file.createdAt
    ).toLocaleDateString()}</td>
    <td class="border border-gray-300 px-8 py-4">${new Date(
      file.modifiedAt
    ).toLocaleDateString()}</td>
    <td class="border border-gray-300 px-8 py-4">
      <button class="preview-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2">
        Preview
      </button>
      <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
        Delete
      </button>
    </td>
  `;
  wireRowEvents(row, file);
}

function wireRowEvents(row: HTMLElement, file: FileItem) {
  const previewBtn = row.querySelector(".preview-btn");
  const deleteBtn = row.querySelector(".delete-btn");

  // Remove existing listeners before adding new ones
  previewBtn?.replaceWith(previewBtn.cloneNode(true));
  deleteBtn?.replaceWith(deleteBtn.cloneNode(true));

  row.querySelector(".preview-btn")?.addEventListener("click", async () => {
    await previewFile(file.fileId, file.ownerId, file.fileName);
  });

  row.querySelector(".delete-btn")?.addEventListener("click", async () => {
    if (!confirm(`Are you sure you want to delete ${file.fileName}?`)) return;

    try {
      await fileService.deleteFile(file.fileId, file.ownerId);
      row.remove();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete file.");
    }
  });
}

export function removeFileRow(fileName: string) {
  const row = document.querySelector(
    `tr[data-filename="${CSS.escape(fileName)}"]`
  );
  if (row) row.remove();
}

export function addListenerOnce(
  element: HTMLElement | null,
  event: string,
  listener: EventListenerOrEventListenerObject
) {
  if (element && !(element as any)._listenerAdded) {
    element.addEventListener(event, listener);
    (element as any)._listenerAdded = true;
  }
}

export function clearFileTable() {
  const tbody = document.getElementById("fileTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
