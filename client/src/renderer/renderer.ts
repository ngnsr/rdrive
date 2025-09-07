import fileService from "../services/file-service";
import { renderTable } from "../utils/render-table";
import "./styles.css";

let currentUser: { loginId: string } | null = null;

// DOM elements
const authContainer = document.getElementById("authContainer") as HTMLElement;

const loginForm = document.getElementById("loginForm") as HTMLFormElement;
const signupForm = document.getElementById("signupForm") as HTMLFormElement;
const confirmForm = document.getElementById("confirmForm") as HTMLFormElement;
const userInfo = document.getElementById("userInfo") as HTMLElement;
const userEmail = document.getElementById("userEmail") as HTMLElement;

const showSignUpBtn = document.getElementById(
  "showSignUpBtn"
) as HTMLButtonElement;
const showSignInBtn = document.getElementById(
  "showSignInBtn"
) as HTMLButtonElement;
const showSignInFromConfirm = document.getElementById(
  "showSignInFromConfirm"
) as HTMLButtonElement;

const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement;
const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
const refreshBtn = document.getElementById("refreshBtn") as HTMLButtonElement;

// Utility to safely add listeners once
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

// ---- AUTH STATE ----
async function checkAuthState() {
  try {
    const user = await window.Auth.getUser();
    currentUser = { loginId: user.signInDetails?.loginId };
    console.log("User is authenticated:", user);
    showUserInfo(currentUser);
    await fileService.fetchFiles();
    renderTable();
  } catch (err) {
    console.log("No authenticated user");
    currentUser = null;
    authContainer.classList.remove("hidden");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    confirmForm.classList.add("hidden");

    if (userInfo) userInfo.classList.add("hidden");
  }
}

// ---- LOGIN ----
addListenerOnce(loginForm, "submit", async (e) => {
  e.preventDefault();
  const email = (document.getElementById("loginEmail") as HTMLInputElement)
    .value;
  const password = (
    document.getElementById("loginPassword") as HTMLInputElement
  ).value;

  try {
    const result = await window.Auth.login(email, password);
    console.log("result", result);
    currentUser = { loginId: email };
    console.log("Login successful:", result);

    // Show user info after login
    showUserInfo(currentUser);

    await fileService.fetchFiles();
    renderTable();
  } catch (err) {
    console.error("Login error:", err);
  }
});

// ---- SIGNUP ----
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

// ---- CONFIRM ----
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

// ---- TOGGLE FORMS ----
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

// ---- LOGOUT ----
addListenerOnce(logoutBtn, "click", async () => {
  try {
    await window.Auth.logout();

    // Reset UI
    authContainer.classList.remove("hidden");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    confirmForm.classList.add("hidden");

    // Hide user info and clear email display
    if (userInfo) userInfo.classList.add("hidden");
    if (userEmail) userEmail.innerText = "";

    // Clear current user reference
    currentUser = null;

    console.log("Logout successful");
  } catch (err) {
    console.error("Logout error:", err);
  }
});

// ---- UPLOAD ----
// addListenerOnce(uploadBtn, "click", async () => {
//   try {
//     await fileService.uploadFile();
//     renderTable(fileService.getFiles());
//   } catch (err) {
//     console.error("Upload error:", err);
//   }
// });

// ---- REFRESH ----
addListenerOnce(refreshBtn, "click", async () => {
  if (!currentUser) {
    alert("You must be logged in to refresh files!");
    return;
  }
  try {
    await fileService.fetchFiles();
    renderTable();
  } catch (err) {
    console.error("Refresh error:", err);
  }
});

// ---- Helper to update user info UI ----
function showUserInfo(user: { loginId: string }) {
  if (userInfo && userEmail) {
    userInfo.classList.remove("hidden");
    userEmail.innerText = user.loginId || "Unknown";
  }
  authContainer.classList.add("hidden");
}

// ---- INIT ----
checkAuthState();
