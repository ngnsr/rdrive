import fileService from "../services/file-service";
import { fetchFilesAndRenderTable } from "../utils/render-table";
import { addFileRow, removeFileRow, updateFileRow } from "../utils/table-utils";
import "./styles.css";

let currentUser: { loginId: string } | null = null;

// DOM elements
const authContainer = document.getElementById("authContainer")!;
const appContainer = document.getElementById("appContainer")!;
const loginForm = document.getElementById("loginForm") as HTMLFormElement;
const signupForm = document.getElementById("signupForm") as HTMLFormElement;
const confirmForm = document.getElementById("confirmForm") as HTMLFormElement;
const userEmail = document.getElementById("userEmail")!;
const userInfo = document.getElementById("userInfo")!;
const controls = document.getElementById("controls")!;
const uploadForm = document.getElementById("uploadForm")!;
const appDiv = document.getElementById("app")!;
const fileInput =
  uploadForm.querySelector<HTMLInputElement>('input[type="file"]');
const fileNameSpan = document.getElementById("fileName")!;
const modal = document.getElementById("previewModal") as HTMLElement;

const uploadBtn = uploadForm.querySelector(
  'button[type="submit"]'
) as HTMLButtonElement;
const showSignUpBtn = document.getElementById("showSignUp")!;
const showSignInBtn = document.getElementById("showSignIn")!;
const showSignInFromConfirm = document.getElementById("showSignInFromConfirm")!;
const logoutBtn = document.getElementById("logoutBtn")!;
const refreshBtn = document.getElementById("refreshButton")!;
const closeBtn = document.getElementById("closePreview") as HTMLElement;

function addListenerOnce(
  element: HTMLElement | null,
  event: string,
  listener: EventListenerOrEventListenerObject
) {
  if (element && !(element as any)._listenerAdded) {
    element.addEventListener(event, listener);
    (element as any)._listenerAdded = true;
  }
}

// ---------------- AUTH STATE ----------------
async function checkAuthState() {
  try {
    const user = await window.Auth.getUser();
    currentUser = { loginId: user.signInDetails?.loginId };
    showAuthorizedUI(currentUser);
    await fetchFilesAndRenderTable(currentUser);
  } catch {
    currentUser = null;
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
    currentUser = { loginId: email };
    showAuthorizedUI(currentUser);
    await fetchFilesAndRenderTable(currentUser);
  } catch (err) {
    console.error("Login error:", err);
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
  } catch (err) {
    console.error("Signup error:", err);
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
  } catch (err) {
    console.error("Confirmation error:", err);
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
    currentUser = null;
    showUnauthorizedUI();
  } catch (err) {
    console.error("Logout error:", err);
  }
});

// ---------------- REFRESH ----------------
addListenerOnce(refreshBtn, "click", async () => {
  if (!currentUser) return;
  try {
    const changes = await fileService.syncFiles(currentUser.loginId);

    // deletes
    changes.delete.forEach((f) => {
      removeFileRow(f.fileName, appContainer!);
    });

    // downloads/updates
    for (const f of changes.download) {
      const { downloadUrl } = await fileService.fetchDownloadUrl(
        f.fileId,
        currentUser!.loginId
      );

      const updatedFile = fileService
        .getFiles()
        .find((file) => file.fileName === f.fileName);

      if (!updatedFile) continue;

      const row = appContainer?.querySelector(
        `tr[data-filename="${CSS.escape(f.fileName)}"]`
      );
      if (row) {
        updateFileRow(updatedFile, row as HTMLElement);
      } else {
        const tbody = appContainer?.querySelector("tbody");
        if (tbody) addFileRow(updatedFile, tbody as HTMLElement);
      }
    }
  } catch (err) {
    console.error("Sync error:", err);
  }
});

// ---------------- UPLOAD FILE ----------------
addListenerOnce(fileInput, "change", () => {
  if (!fileInput?.files) return;
  if (fileInput.files && fileInput.files.length > 0) {
    fileNameSpan.textContent = fileInput.files[0].name;
  } else {
    fileNameSpan.textContent = "No file chosen";
  }
});

addListenerOnce(uploadBtn, "click", async (e) => {
  e.preventDefault();

  if (!fileInput?.files?.length || !currentUser) {
    alert("Please select a file before uploading.");
    return;
  }

  const file = fileInput.files[0];
  try {
    await fileService.uploadFile(file, currentUser.loginId);
    fileNameSpan.textContent = "No file chosen"; // Reset after upload
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed.");
  }
});

// ---------------- PREVIEW MODAL ----------------
addListenerOnce(closeBtn, "click", () => {
  modal?.classList.add("hidden");
});

addListenerOnce(document.body, "keydown", ((e: Event) => {
  if ((e as KeyboardEvent).key === "Escape") {
    modal?.classList.add("hidden");
  }
}) as EventListener);

// ---------------- UI HELPERS ----------------
function showAuthorizedUI(user: { loginId: string }) {
  authContainer.classList.add("hidden");
  appContainer.classList.remove("hidden");
  controls.classList.remove("hidden");
  uploadForm.classList.remove("hidden");
  userInfo.classList.remove("hidden");
  userEmail.innerText = user.loginId || "Unknown";
}

function showUnauthorizedUI() {
  authContainer.classList.remove("hidden");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  confirmForm.classList.add("hidden");

  appContainer.classList.add("hidden");
  controls.classList.add("hidden");
  uploadForm.classList.add("hidden");
  userInfo.classList.add("hidden");
  userEmail.innerText = "";
  appDiv.innerHTML = "";
}

// ---------------- INIT ----------------
checkAuthState();
