import "./styles.css";
import fileService, { FileItem } from "./file-service";

// Define types for window.Auth and window.electronAPI
declare global {
  interface Window {
    Auth: {
      register: (email: string, password: string, name: string) => Promise<any>;
      login: (email: string, password: string) => Promise<any>;
      logout: () => Promise<void>;
      getUser: () => Promise<any>;
      confirm: (email: string, code: string) => Promise<any>;
    };
    electronAPI: {
      uploadFile: (filePath: string) => Promise<any>;
      deleteFile: (fileName: string) => Promise<any>;
      fetchFiles: () => Promise<any>;
    };
  }
}

// Debug log to confirm renderer loading
setTimeout(() => console.log("renderer.ts loaded ✅"), 1000);

// DOM elements
const loginForm = document.getElementById("loginForm") as HTMLFormElement;
const signupForm = document.getElementById("signupForm") as HTMLFormElement;
const showSignUpBtn = document.getElementById("showSignUp");
const showSignInBtn = document.getElementById("showSignIn");
const appContainer = document.getElementById("app");
const confirmForm = document.getElementById("confirmForm") as HTMLFormElement;
const showSignInFromConfirm = document.getElementById("showSignInFromConfirm");

// Toggle forms
showSignUpBtn?.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
});

showSignInBtn?.addEventListener("click", () => {
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = (document.getElementById("signupEmail") as HTMLInputElement)
    .value;
  const password = (
    document.getElementById("signupPassword") as HTMLInputElement
  ).value;
  const name = (document.getElementById("signupName") as HTMLInputElement)
    .value;

  try {
    await window.Auth.register(email, password, name);
    signupForm.classList.add("hidden");
    confirmForm.classList.remove("hidden");
    (document.getElementById("confirmEmail") as HTMLInputElement).value = email; // prefill
  } catch (err) {
    console.error("Signup error:", err);
  }
});

confirmForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = (document.getElementById("confirmEmail") as HTMLInputElement)
    .value;
  const code = (document.getElementById("confirmCode") as HTMLInputElement)
    .value;

  try {
    await window.Auth.confirm(email, code);
    confirmForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  } catch (err) {
    console.error("Confirmation error:", err);
  }
});

showSignInFromConfirm?.addEventListener("click", () => {
  confirmForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// Handle login
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Login form submitted");
  const email = (document.getElementById("loginEmail") as HTMLInputElement)
    .value;
  const password = (
    document.getElementById("loginPassword") as HTMLInputElement
  ).value;

  try {
    const result = await window.Auth.login(email, password);
    if (result.isSignedIn) {
      console.log("Login successful, rendering drive UI");
      loginForm.classList.add("hidden");
      signupForm.classList.add("hidden");
      await fileService.fetchFiles();
      renderTable(fileService.getFiles());
    } else {
      console.log("Next step required:", result.nextStep);
    }
  } catch (err) {
    console.error("Login error:", err);
  }
});

// Renders the file table
function renderTable(files: FileItem[]) {
  if (!appContainer) {
    console.error("App container not found");
    return;
  }

  appContainer.innerHTML = ""; // Clear previous table

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
        try {
          await fileService.deleteFile(file);
          await fileService.fetchFiles();
          renderTable(fileService.getFiles());
        } catch (err) {
          console.error("Delete file error:", err);
        }
      });
      (deleteButton as any)._listenerAdded = true;
    }

    actionsTd.appendChild(deleteButton);
    row.appendChild(actionsTd);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  appContainer.appendChild(table);
}

// Initialize event listeners
function initEventListeners() {
  const sortButton = document.getElementById("sortButton");
  const filterSelect = document.getElementById(
    "filterSelect"
  ) as HTMLSelectElement;
  const refreshButton = document.getElementById("refreshButton");
  const fileInput =
    document.querySelector<HTMLInputElement>('input[name="file"]');
  const fileNameSpan = document.getElementById("fileName");
  const uploadForm = document.getElementById("uploadForm");

  // Sort by modified
  if (sortButton && !(sortButton as any)._listenerAdded) {
    sortButton.addEventListener("click", async () => {
      fileService.sortByModified();
      await fileService.fetchFiles();
      renderTable(fileService.getFiles());
    });
    (sortButton as any)._listenerAdded = true;
  }

  // Filter files
  if (filterSelect && !(filterSelect as any)._listenerAdded) {
    filterSelect.addEventListener("change", async () => {
      fileService.setFilterType(filterSelect.value);
      await fileService.fetchFiles();
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
        console.log("Upload form submitted");
        const file = fileInput.files?.[0];
        if (file) {
          try {
            console.log("Uploading file:", file.name);
            await fileService.uploadFile(file);
            await fileService.fetchFiles();
            renderTable(fileService.getFiles());
            fileInput.value = "";
            fileNameSpan.innerText = "No file chosen";
          } catch (err) {
            console.error("Upload error:", err);
          }
        }
      });
      (uploadForm as any)._listenerAdded = true;
    }
  }
}

// Check authentication state on load
async function checkAuthState() {
  try {
    const user = await window.Auth.getUser();
    console.log("User is authenticated:", user);
    loginForm.classList.add("hidden");
    signupForm.classList.add("hidden");
    await fileService.fetchFiles();
    renderTable(fileService.getFiles());
  } catch (err) {
    console.log("No authenticated user, showing login form");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
  }
}

// DOM ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded fired");
  initEventListeners();
  checkAuthState();
});
