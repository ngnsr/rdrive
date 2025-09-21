import "./amplify-config";
import {
  getCurrentUser,
  signIn,
  signOut,
  signUp,
  confirmSignUp,
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
  return await signIn({ username: email, password });
}

export async function logout() {
  return await signOut();
}

export async function getUser() {
  return await getCurrentUser();
}
