import { Mime } from "mime";
import fileService from "../services/file-service";
import { fetchFilesAndRenderTable } from "../utils/render-table";
import { addListenerOnce, setColumnVisibility } from "../utils/table-utils";
import "./styles.css";

// Initialize
window.currentUser = null;

// Helper to update current user globally
window.setCurrentUser = (user: { loginId: string } | null) => {
  window.currentUser = user;
  window.electronStore.set("currentUser", window.currentUser);
};

// Initialize API base URL
async function initializeApp() {
  try {
    // Get API base URL from main process
    const apiBaseUrl = window.env.getApiBaseUrl();
    window.API_BASE_URL = apiBaseUrl;
    await checkAuthState();
    if (window.currentUser) {
      await restoreCachedFolder(window.currentUser.loginId);
    }
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
}

// ---------------- DOM ELEMENTS ----------------
const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");
const loginForm = document.getElementById("loginForm") as HTMLFormElement;
const signupForm = document.getElementById("signupForm") as HTMLFormElement;
const confirmForm = document.getElementById("confirmForm") as HTMLFormElement;
const userEmail = document.getElementById("userEmail");
const userInfo = document.getElementById("userInfo");
const controls = document.getElementById("controls");
const appDiv = document.getElementById("app");
const columnMenu = document.getElementById("columnMenu");
const storageKey = "rdrive.visibleCols";

const modal = document.getElementById("previewModal");

const uploadButton = document.getElementById(
  "uploadButton"
) as HTMLButtonElement;

const showSignUpBtn = document.getElementById("showSignUp");
const showSignInBtn = document.getElementById("showSignIn");
const showSignInFromConfirm = document.getElementById("showSignInFromConfirm");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshButton");
const closeBtn = document.getElementById("closePreview");
const columnMenuBtn = document.getElementById(
  "columnMenuBtn"
) as HTMLButtonElement;
const syncFolderBtn = document.getElementById("syncFolderBtn");
const syncFolderDisplay = document.getElementById("syncFolderPath");

// ---------------- UI HELPERS ----------------
async function showAuthorizedUI(user: { loginId: string }) {
  window.setCurrentUser(user);

  authContainer?.classList.add("hidden");
  appContainer?.classList.remove("hidden");
  controls?.classList.remove("hidden");
  userInfo?.classList.remove("hidden");
  if (userEmail) userEmail.innerText = user.loginId || "Unknown";
  appDiv?.classList.remove("hidden");

  await fetchFilesAndRenderTable(user);
}

function showUnauthorizedUI() {
  window.setCurrentUser(null);

  authContainer?.classList.remove("hidden");
  loginForm?.classList.remove("hidden");
  signupForm?.classList.add("hidden");
  confirmForm?.classList.add("hidden");

  appContainer?.classList.add("hidden");
  controls?.classList.add("hidden");
  userInfo?.classList.add("hidden");
  if (userEmail) userEmail.innerText = "";

  if (appDiv) {
    appDiv.innerHTML = "";
    appDiv.classList.add("hidden");
  }
}

// ---------------- AUTH STATE ----------------
async function checkAuthState() {
  try {
    const user = await window.Auth.getUser();
    await showAuthorizedUI({
      loginId: user.signInDetails.loginId,
    });
  } catch {
    showUnauthorizedUI();
  }
}

// ---------------- LOGIN ----------------
addListenerOnce(loginForm, "submit", async (e) => {
  e.preventDefault();
  const email = (document.getElementById("loginEmail") as HTMLInputElement)
    .value;
  const password = (
    document.getElementById("loginPassword") as HTMLInputElement
  ).value;

  try {
    await window.Auth.login(email, password);
    await showAuthorizedUI({ loginId: email });
  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed");
  }
});

// ---------------- SIGNUP ----------------
addListenerOnce(signupForm, "submit", async (e) => {
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
    (document.getElementById("confirmEmail") as HTMLInputElement).value = email;
    alert("Signup successful! Check your email for confirmation code.");
  } catch (err) {
    console.error("Signup error:", err);
    alert("Signup failed");
  }
});

// ---------------- CONFIRM ----------------
addListenerOnce(confirmForm, "submit", async (e) => {
  e.preventDefault();
  const email = (document.getElementById("confirmEmail") as HTMLInputElement)
    .value;
  const code = (document.getElementById("confirmCode") as HTMLInputElement)
    .value;

  try {
    await window.Auth.confirm(email, code);
    confirmForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    alert("Account confirmed! Please login.");
  } catch (err) {
    console.error("Confirmation error:", err);
    alert("Confirmation failed");
  }
});

// ---------------- LOGOUT ----------------
addListenerOnce(logoutBtn, "click", async () => {
  try {
    await window.Auth.logout();
    showUnauthorizedUI();
    alert("Logged out successfully");
  } catch (err) {
    console.error("Logout error:", err);
  }
});

// ---------------- TOGGLE FORMS ----------------
addListenerOnce(showSignUpBtn, "click", () => {
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
});
addListenerOnce(showSignInBtn, "click", () => {
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});
addListenerOnce(showSignInFromConfirm, "click", () => {
  confirmForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// ---------------- LOGOUT ----------------
addListenerOnce(logoutBtn, "click", async () => {
  try {
    await window.Auth.logout();
    window.setCurrentUser(null);
    showUnauthorizedUI();
  } catch (err) {
    console.error("Logout error:", err);
  }
});

// ---------------- REFRESH ----------------
addListenerOnce(refreshBtn, "click", async () => {
  const user = window.currentUser;
  if (!user) return;
  try {
    await fetchFilesAndRenderTable(user);
  } catch (err) {
    console.error("Sync error:", err);
  }
});

// ---------------- UPLOAD FILE ----------------
addListenerOnce(uploadButton, "click", async () => {
  try {
    const user = window.currentUser;
    if (!user) return;
    const result = await window.electronApi.selectFile();
    if (!result || result.canceled || !result.filePaths.length) return;
    const filePath = result.filePaths[0];
    const fileData = await window.fsApi.readFile(filePath);
    const file = new File([fileData.buffer], fileData.name, {
      type: fileData.type || "application/octet-stream",
      lastModified: fileData.lastModified,
    });
    const syncFolder = window.electronStore.get(`syncFolder_${user.loginId}`);
    const uploaded = await fileService.uploadFile(file, user.loginId, filePath);
    if (uploaded) {
      await window.electronApi.copyToSyncFolder(filePath, syncFolder);
      // Refresh the file list after successful upload
      await fetchFilesAndRenderTable(user);
    }
  } catch (error) {
    console.error("File upload:", error);
  }
});

// ---------------- PROFILE MENU ----------------
const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

if (profileBtn && profileMenu) {
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (
      !profileMenu.contains(e.target as Node) &&
      !profileBtn.contains(e.target as Node)
    ) {
      profileMenu.classList.add("hidden");
    }
  });
}

// ---------------- PREVIEW MODAL ----------------
addListenerOnce(closeBtn, "click", () => {
  modal?.classList.add("hidden");
});

addListenerOnce(document.body, "keydown", (e) => {
  if ((e as KeyboardEvent).key === "Escape") {
    modal?.classList.add("hidden");
  }
});

// ---------------- FOLDER SYNC ----------------
async function selectFolderAndStartSync(userId: string) {
  try {
    const result = await window.electronApi.selectFolder();
    if (result.canceled || !result.filePaths.length) return;
    const folderPath = result.filePaths[0];
    window.electronStore.set(`syncFolder_${userId}`, folderPath);
    if (syncFolderDisplay) syncFolderDisplay.innerText = folderPath;
    window.electronApi.startFolderSync(folderPath, userId);
  } catch (error) {
    console.error("Folder sync error:", error);
  }
}

async function restoreCachedFolder(userId: string) {
  try {
    const folderPath = window.electronStore.get(`syncFolder_${userId}`);
    if (folderPath) {
      console.log("Restoring cached folder:", folderPath);
      if (syncFolderDisplay) syncFolderDisplay.innerText = folderPath;
      window.electronApi.startFolderSync(folderPath, userId);
    }
  } catch (error) {
    console.error("Failed to restore cached folder:", error);
  }
}

window.electronApi.onFileDeleted(async (_event, { fileName, ownerId }) => {
  const file = fileService.getFiles().find((f) => f.fileName === fileName);
  if (!file) return;

  await fileService.deleteFile(file.fileId, ownerId, true);
});

const IGNORED_FILES = [".DS_Store", "Thumbs.db", ".localized", ".gitkeep"];
window.electronApi.onFileUploaded(
  async (_event, { fileName, ownerId, filePath }) => {
    console.log("Uploaded file:", fileName, "by", ownerId);
    if (!filePath) return;

    if (IGNORED_FILES.includes(fileName) || fileName.startsWith(".")) {
      console.log("Ignoring file:", fileName);
      return;
    }
    // Read file info from main thread
    const fileData = await window.fsApi.readFile(filePath);

    // Wrap buffer into a real File object
    const file = new File([fileData.buffer], fileData.name, {
      type: fileData.type || "application/octet-stream",
      lastModified: fileData.lastModified,
    });

    // Now arrayBuffer() works, no .buffer access
    await fileService.uploadFile(file, ownerId, filePath);
  }
);

// ---------------- BUTTON CLICK ----------------
addListenerOnce(syncFolderBtn, "click", () => {
  const user = window.currentUser;
  if (!user) return;
  selectFolderAndStartSync(user.loginId);
});

if (columnMenuBtn && columnMenu) {
  // Restore column states
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  document.querySelectorAll<HTMLInputElement>(".col-toggle").forEach((cb) => {
    const col = cb.dataset.col!;
    const isVisible = saved.hasOwnProperty(col) ? saved[col] : true;
    cb.checked = isVisible;
    setColumnVisibility(col, isVisible);

    cb.addEventListener("change", () => {
      setColumnVisibility(col, cb.checked);
      saved[col] = cb.checked;
      localStorage.setItem(storageKey, JSON.stringify(saved));
    });
  });

  // Toggle menu
  columnMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    columnMenu.classList.toggle("hidden");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !columnMenu.contains(e.target as Node) &&
      !columnMenuBtn.contains(e.target as Node)
    ) {
      columnMenu.classList.add("hidden");
    }
  });
}

// ---------------- INIT ----------------
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
