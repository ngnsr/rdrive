import "./styles.css";
import fileService, { FileItem } from "./FileService";

// Renders the file table
function renderTable(files: FileItem[]) {
  const container = document.getElementById("app");
  if (!container) return;

  container.innerHTML = ""; // Clear previous table

  const table = document.createElement("table");
  table.className =
    "table-auto w-full max-w-4xl mx-auto border-collapse border border-gray-300 shadow-lg rounded-lg mt-4";

  // Table header
  const thead = document.createElement("thead");
  thead.className = "bg-gray-300";
  const headerRow = document.createElement("tr");
  ["Name", "Created", "Modified", "Owner", "Editor", "Actions"].forEach((h) => {
    const th = document.createElement("th");
    th.className =
      "border border-gray-400 px-8 py-4 text-left text-base font-semibold text-gray-800 uppercase";
    th.innerText = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement("tbody");
  files.forEach((file) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-100 transition-colors";

    [
      file.name,
      file.createdAt.toLocaleDateString(),
      file.modifiedAt.toLocaleDateString(),
      file.owner,
      file.editor,
    ].forEach((value) => {
      const td = document.createElement("td");
      td.className =
        "border border-gray-300 px-8 py-4 text-base text-gray-900 min-w-[150px] max-w-[200px] break-words";
      td.innerText = value;
      row.appendChild(td);
    });

    const actionsTd = document.createElement("td");
    actionsTd.className = "border border-gray-300 px-8 py-4";

    const deleteButton = document.createElement("button");
    deleteButton.innerText = "Delete";
    deleteButton.className =
      "bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600";

    // Delete file
    if (!(deleteButton as any)._listenerAdded) {
      deleteButton.addEventListener("click", async () => {
        await fileService.deleteFile(file);
        renderTable(fileService.getFiles());
      });
      (deleteButton as any)._listenerAdded = true;
    }

    actionsTd.appendChild(deleteButton);
    row.appendChild(actionsTd);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

// Initialize all event listeners once
function initEventListeners() {
  const sortButton = document.getElementById("sortButton");
  const filterSelect = document.getElementById(
    "filterSelect"
  ) as HTMLSelectElement;
  const refreshButton = document.getElementById("refreshButton");
  const fileInput =
    document.querySelector<HTMLInputElement>("input[name='file']");
  const fileNameSpan = document.getElementById("fileName");
  const uploadForm = document.getElementById("uploadForm");

  // Sort by modified
  if (sortButton && !(sortButton as any)._listenerAdded) {
    sortButton.addEventListener("click", () => {
      fileService.sortByModified();
      renderTable(fileService.getFiles());
    });
    (sortButton as any)._listenerAdded = true;
  }

  // Filter files
  if (filterSelect && !(filterSelect as any)._listenerAdded) {
    filterSelect.addEventListener("change", () => {
      fileService.setFilterType(filterSelect.value);
      renderTable(fileService.getFiles());
    });
    (filterSelect as any)._listenerAdded = true;
  }

  // Refresh table
  if (refreshButton && !(refreshButton as any)._listenerAdded) {
    refreshButton.addEventListener("click", async () => {
      await fileService.fetchFiles();
      renderTable(fileService.getFiles());
    });
    (refreshButton as any)._listenerAdded = true;
  }

  // File input and upload
  if (fileInput && fileNameSpan && uploadForm) {
    // File selection
    if (!(fileInput as any)._listenerAdded) {
      fileInput.addEventListener("change", (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        fileNameSpan.innerText = file ? file.name : "No file chosen";
      });
      (fileInput as any)._listenerAdded = true;
    }

    // Form submit
    if (!(uploadForm as any)._listenerAdded) {
      uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Upload form submit triggered");
        const file = fileInput.files?.[0];
        if (file) {
          console.log("Uploading file:", file.name);
          await fileService.uploadFile(file);
          renderTable(fileService.getFiles());
          fileInput.value = "";
          fileNameSpan.innerText = "No file chosen";
        }
      });
      (uploadForm as any)._listenerAdded = true;
    }
  }
}

// DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded fired");
  initEventListeners();
  await fileService.fetchFiles();
  renderTable(fileService.getFiles());
});
