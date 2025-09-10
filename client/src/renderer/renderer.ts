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
const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");
const loginForm = document.getElementById("loginForm") as HTMLFormElement;
const signupForm = document.getElementById("signupForm") as HTMLFormElement;
const confirmForm = document.getElementById("confirmForm") as HTMLFormElement;
const userEmail = document.getElementById("userEmail");
const userInfo = document.getElementById("userInfo");
const controls = document.getElementById("controls");
const appDiv = document.getElementById("app");

const modal = document.getElementById("previewModal");

const uploadButton = document.getElementById(
  "uploadButton"
) as HTMLButtonElement;
const fileInput = document.getElementById("fileInput") as HTMLInputElement; // hidden input

const showSignUpBtn = document.getElementById("showSignUp");
const showSignInBtn = document.getElementById("showSignIn");
const showSignInFromConfirm = document.getElementById("showSignInFromConfirm");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshButton");
const closeBtn = document.getElementById("closePreview");

// ---------------- UI HELPERS ----------------
async function showAuthorizedUI(user: { loginId: string }) {
  window.setCurrentUser(user);

  authContainer?.classList.add("hidden");
  appContainer?.classList.remove("hidden");
  controls?.classList.remove("hidden");
  userInfo?.classList.remove("hidden");
  if (userEmail) userEmail.innerText = user.loginId || "Unknown";
  appDiv?.classList.remove("hidden");

  // // Wait to DOM to fully load
  // await new Promise((resolve) => requestAnimationFrame(resolve));
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
    // await fileService.syncFiles(user.loginId);
    await fetchFilesAndRenderTable(user);
  } catch (err) {
    console.error("Sync error:", err);
  }
});

// ---------------- UPLOAD FILE ----------------
addListenerOnce(uploadButton, "click", () => {
  fileInput?.click();
});

addListenerOnce(fileInput, "change", async () => {
  const user = window.currentUser;
  if (!fileInput.files?.length || !user) return;

  const file = fileInput.files[0];
  try {
    await fileService.uploadFile(file, user.loginId);
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed.");
  } finally {
    fileInput.value = ""; // reset so same file can be picked again
  }
});

// ---------------- PROFILE MENU ----------------
const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

if (profileBtn && profileMenu) {
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent click from bubbling to body
    profileMenu.classList.toggle("hidden");
  });

  // Close menu if clicking outside
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

// ---------------- INIT ----------------
checkAuthState();
