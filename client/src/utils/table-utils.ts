import fileService from "../services/file-service";
import { previewFile } from "./preview-utils";

export function addFileRow(file: any, tbody: HTMLElement) {
  const newRow = document.createElement("tr");
  newRow.className = "hover:bg-gray-100 transition-colors";
  newRow.setAttribute("data-fileid", file.fileId);
  newRow.innerHTML = renderRowContent(file);

  tbody.appendChild(newRow);
  wireRowEvents(newRow, file);
}

export function updateFileRow(file: any, row: HTMLElement) {
  row.innerHTML = renderRowContent(file);
  wireRowEvents(row, file);
}

function wireRowEvents(row: HTMLElement, file: any) {
  const previewBtn = row.querySelector(".preview-btn");
  previewBtn?.addEventListener("click", async () => {
    await previewFile(file.fileId, file.owner, file.name);
  });

  const deleteBtn = row.querySelector(".delete-btn");
  deleteBtn?.addEventListener("click", async () => {
    try {
      await fileService.deleteFile(file.fileId, file.owner);
      row.remove();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete file.");
    }
  });
}

export function removeFileRow(fileName: string, appContainer: HTMLElement) {
  const row = appContainer.querySelector(
    `tr[data-filename="${CSS.escape(fileName)}"]`
  );
  if (row) row.remove();
}

function renderRowContent(file: any): string {
  return `
    <td class="border border-gray-300 px-8 py-4">${file.name}</td>
    <td class="border border-gray-300 px-8 py-4">${formatSize(file.size)}</td>
    <td class="border border-gray-300 px-8 py-4">${new Date(
      file.createdAt
    ).toLocaleDateString()}</td>
    <td class="border border-gray-300 px-8 py-4">${new Date(
      file.modifiedAt
    ).toLocaleDateString()}</td>
    <td class="border border-gray-300 px-8 py-4">
      <button data-fileid="${file.fileId}"
        data-filename="${file.name}"
        class="preview-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2">
        Preview
      </button>
      <button data-fileid="${file.fileId}"
        class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
        Delete
      </button>
    </td>
  `;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
