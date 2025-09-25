import "./amplify-config";
import {
  getCurrentUser,
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  fetchAuthSession,
} from "@aws-amplify/auth";

export async function register(email: string, password: string, name: string) {
  return await signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        name,
      },
    },
  });
}

export async function confirm(email: string, code: string) {
  return await confirmSignUp({
    username: email,
    confirmationCode: code,
  });
}

export async function login(email: string, password: string) {
  // 1. Perform sign-in
  const result = await signIn({ username: email, password });

  if (!result.isSignedIn) {
    throw new Error(
      "Sign-in incomplete, next step required: " +
        JSON.stringify(result.nextStep)
    );
  }

  // 2. Fetch current session (contains tokens)
  const session = await fetchAuthSession();

  // 3. Extract tokens
  const idToken = session.tokens?.idToken?.toString();

  if (!idToken) throw new Error("No ID token found in session");

  // 4. Save ID token for backend calls (Bearer auth)
  localStorage.setItem("authToken", idToken);

  return { idToken };
}

export async function logout() {
  return await signOut();
}

export async function getUser() {
  return await getCurrentUser();
}
