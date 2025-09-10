import fileService from "../services/file-service";
import { FileItem, User } from "../types";
import {
  addFileRow,
  addListenerOnce,
  clearFileTable,
} from "../utils/table-utils";

let currentSort = { key: "modifiedAt", ascending: true };

export interface SortState {
  key: string;
  ascending: boolean;
}

export async function renderFiles(files?: FileItem[]) {
  const tbody = document.querySelector("tbody")!;
  // if (!tbody) return;

  // If no files provided, fetch them from service
  if (!files) {
    try {
      files = fileService.getFiles();
    } catch (err) {
      console.error("Failed to get files:", err);
      return;
    }
  }

  // --- Filter ---
  const filterSelect = document.getElementById(
    "filterSelect"
  ) as HTMLSelectElement;
  const filter = filterSelect?.value || "all";

  if (filter !== "all") {
    files = files.filter((f) => f.fileName.endsWith(filter));
  }
  // --- Sort ---
  files.sort((a: any, b: any) => {
    let valA = a[currentSort.key];
    let valB = b[currentSort.key];

    if (currentSort.key === "size") {
      valA = Number(valA);
      valB = Number(valB);
    } else if (
      currentSort.key === "createdAt" ||
      currentSort.key === "modifiedAt"
    ) {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      return currentSort.ascending
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return currentSort.ascending ? valA - valB : valB - valA;
  });

  clearFileTable();
  // --- Add rows ---
  files.forEach((file) => addFileRow(file, tbody));
}

export async function fetchFilesAndRenderTable(user: User) {
  if (!user || !user.loginId) return;
  await fileService.fetchFiles(user.loginId);
  await renderFiles(fileService.getFiles());
}

// ---------------- HEADER SORT ----------------
const headers = document.querySelectorAll<HTMLTableHeaderCellElement>(
  "#fileTable thead th[data-sort]"
);

headers.forEach((th) => {
  // store original header text
  if (!th.dataset.origText) th.dataset.origText = th.innerText;

  addListenerOnce(th as HTMLElement, "click", () => {
    const key = th.getAttribute("data-sort")!;
    // toggle ascending if same column, else default to ascending
    currentSort.ascending =
      currentSort.key === key ? !currentSort.ascending : true;
    currentSort.key = key;

    // update arrows
    updateSortIndicators();

    renderFiles();
  });
});

function updateSortIndicators() {
  const headers = document.querySelectorAll<HTMLTableHeaderCellElement>(
    "#fileTable thead th[data-sort]"
  );

  headers.forEach((th) => {
    const arrow = th.querySelector<HTMLSpanElement>(".sort-arrow")!;
    // if (!arrow) return;
    arrow.innerHTML = ""; // reset

    if (th.getAttribute("data-sort") === currentSort.key) {
      if (currentSort.ascending) {
        arrow.innerHTML = `<svg class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M5 12l5-5 5 5H5z"/></svg>`;
      } else {
        arrow.innerHTML = `<svg class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M5 8l5 5 5-5H5z"/></svg>`;
      }
    }
  });
}

// ---------------- FILTER ----------------
(
  document.getElementById("filterSelect") as HTMLSelectElement
)?.addEventListener("change", () => {
  renderFiles();
});
