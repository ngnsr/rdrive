import fileService from "../services/file-service";
import { fetchFilesAndRenderTable } from "../utils/render-table";
import { addListenerOnce } from "../utils/table-utils";
import "./styles.css";

// Initialize
window.currentUser = null;

// Helper to update current user globally
window.setCurrentUser = (user: { loginId: string } | null) => {
  window.currentUser = user;
};

// ---------------- DOM ELEMENTS ----------------
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

// ---------------- UI HELPERS ----------------
async function showAuthorizedUI(user: { loginId: string }) {
  // Set current user globally
  window.setCurrentUser(user);
  // Show main UI
  authContainer.classList.add("hidden");
  appContainer.classList.remove("hidden"); // make table container visible
  controls.classList.remove("hidden");
  uploadForm.classList.remove("hidden");
  userInfo.classList.remove("hidden");
  userEmail.innerText = user.loginId || "Unknown";
  // Remove any hidden class from the table itself, just in case
  appDiv.classList.remove("hidden");
  await fetchFilesAndRenderTable(user);
}

function showUnauthorizedUI() {
  // Clear global user
  window.setCurrentUser(null);
  // Show auth forms
  authContainer.classList.remove("hidden");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  confirmForm.classList.add("hidden");
  // Hide main app UI
  appContainer.classList.add("hidden");
  controls.classList.add("hidden");
  uploadForm.classList.add("hidden");
  userInfo.classList.add("hidden");
  userEmail.innerText = "";

  // Clear table content and remove hidden class
  appDiv.innerHTML = "";
  appDiv.classList.add("hidden");
}

// ---------------- AUTH STATE ----------------
async function checkAuthState() {
  try {
    const user = await window.Auth.getUser();
    await showAuthorizedUI({ loginId: user.signInDetails?.loginId });
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
    showAuthorizedUI({ loginId: email });
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
    const changes = await fileService.syncFiles(user.loginId);
    await fetchFilesAndRenderTable(user); // re-render table
  } catch (err) {
    console.error("Sync error:", err);
  }
});

// ---------------- UPLOAD FILE ----------------
addListenerOnce(fileInput, "change", () => {
  if (!fileInput?.files) return;
  fileNameSpan.textContent = fileInput.files[0]?.name || "No file chosen";
});

addListenerOnce(uploadBtn, "click", async (e) => {
  e.preventDefault();
  const user = window.currentUser;
  if (!fileInput?.files?.length || !user) {
    alert("Please select a file before uploading.");
    return;
  }

  const file = fileInput.files[0];
  try {
    await fileService.uploadFile(file, user.loginId);
    fileNameSpan.textContent = "No file chosen";
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed.");
  }
});

// ---------------- PREVIEW MODAL ----------------
addListenerOnce(closeBtn, "click", () => {
  modal?.classList.add("hidden");
});

addListenerOnce(document.body, "keydown", (e) => {
  if ((e as KeyboardEvent).key === "Escape") {
    modal?.classList.add("hidden");
  }
});

// ---------------- INIT ----------------
checkAuthState();
