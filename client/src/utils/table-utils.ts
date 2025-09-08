export function addFileRow(file: any, tbody: HTMLElement) {
  const newRow = document.createElement("tr");
  newRow.className = "hover:bg-gray-100 transition-colors";
  newRow.setAttribute("data-filename", file.name);
  newRow.innerHTML = `
    <td class="border border-gray-300 px-8 py-4">${file.name}</td>
    <td class="border border-gray-300 px-8 py-4">${formatSize(file.size)}</td>
    <td class="border border-gray-300 px-8 py-4">${new Date(
      file.createdAt
    ).toLocaleDateString()}</td>
    <td class="border border-gray-300 px-8 py-4">${new Date(
      file.modifiedAt
    ).toLocaleDateString()}</td>
    <td class="border border-gray-300 px-8 py-4">
      <button data-filename="${file.name}"
        class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
        Delete
      </button>
    </td>
  `;
  tbody.appendChild(newRow);
}

export function updateFileRow(file: any, row: HTMLElement) {
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
      <button data-filename="${file.name}"
        class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
        Delete
      </button>
    </td>
  `;
}

export function removeFileRow(fileName: string, appContainer: HTMLElement) {
  const row = appContainer.querySelector(
    `tr[data-filename="${CSS.escape(fileName)}"]`
  );
  if (row) row.remove();
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
