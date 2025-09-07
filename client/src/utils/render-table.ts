interface FileItem {
  name: string;
  size: number;
  createdAt: string | number;
  modifiedAt: string | number;
  owner?: string;
  editor?: string;
}

// Reference the app container once
const appContainer = document.getElementById("app");

export async function renderTable(currentUser: { loginId: string } | null) {
  if (!appContainer) return;

  // --- Guard: unauthorized users ---
  if (!currentUser) {
    appContainer.innerHTML = ""; // clear previous table
    appContainer.classList.add("hidden"); // hide container
    return;
  }

  // --- Authorized users ---
  appContainer.classList.remove("hidden");

  let files: FileItem[] = [];
  try {
    files = await window.electronAPI.fetchFiles();
  } catch (err) {
    console.error("Failed to fetch files:", err);
    appContainer.innerHTML = `
      <div class="text-red-500 text-center py-6">Failed to load files</div>
    `;
    return;
  }

  appContainer.innerHTML = "";

  if (!files.length) {
    appContainer.innerHTML = `
      <div class="text-gray-500 text-center py-6">No files available</div>
    `;
    return;
  }

  // --- Render table as before ---
  const table = document.createElement("table");
  table.className =
    "table-auto w-full max-w-4xl mx-auto border-collapse border border-gray-300 shadow-lg rounded-lg mt-4";

  const thead = document.createElement("thead");
  thead.className = "bg-gray-300";
  thead.innerHTML = `
    <tr>
      <th class="border border-gray-400 px-8 py-4 text-left">Name</th>
      <th class="border border-gray-400 px-8 py-4 text-left">Size</th>
      <th class="border border-gray-400 px-8 py-4 text-left">Created</th>
      <th class="border border-gray-400 px-8 py-4 text-left">Modified</th>
      <th class="border border-gray-400 px-8 py-4 text-left">Actions</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  files.forEach((file) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-100 transition-colors";
    row.innerHTML = `
      <td class="border border-gray-300 px-8 py-4">${file.name}</td>
      <td class="border border-gray-300 px-8 py-4">${formatSize(file.size)}</td>
      <td class="border border-gray-300 px-8 py-4">${new Date(
        file.createdAt
      ).toLocaleDateString()}</td>
      <td class="border border-gray-300 px-8 py-4">${new Date(
        file.modifiedAt
      ).toLocaleDateString()}</td>
      <td class="border border-gray-300 px-8 py-4">
        <button data-filename="${
          file.name
        }" class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  appContainer.appendChild(table);

  tbody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const fileName = (btn as HTMLElement).getAttribute("data-filename");
      if (!fileName) return;

      if (confirm(`Delete file "${fileName}"?`)) {
        try {
          await window.electronAPI.deleteFile(fileName);
          await renderTable(currentUser);
        } catch (err) {
          console.error("Delete file error:", err);
        }
      }
    });
  });
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
