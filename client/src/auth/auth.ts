import "./amplify-config";
import {
  getCurrentUser,
  signIn,
  signOut,
  signUp,
  confirmSignUp,
} from "@aws-amplify/auth";

// Sign up a new user
export async function register(email: string, password: string, name: string) {
  try {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });
    console.log("Signup successful", result);
    alert("Signup successful! Check your email for confirmation code.");
    return result;
  } catch (err) {
    console.error("Signup error", err);
    alert(err);
    throw err;
  }
}

// Sign up confirm
export async function confirm(email: string, code: string) {
  try {
    const result = await confirmSignUp({
      username: email,
      confirmationCode: code,
    });
    console.log("Confirmation successful", result);
    alert("Your account is confirmed! You can now log in.");
    return result;
  } catch (err) {
    console.error("Confirmation error", err);
    alert(err);
    throw err;
  }
}

// Sign in
export async function login(email: string, password: string) {
  console.log("here");
  const result = await signIn({ username: email, password });

  if (result.isSignedIn) {
    console.log("User signed in successfully");
  } else {
    console.log("Next step required:", result.nextStep);
  }

  return result;
}

// Sign out
export async function logout() {
  try {
    await signOut();
    alert("Logged out successfully");
  } catch (err) {
    console.error("Logout error", err);
    alert(err);
    throw err;
  }
}

// Get current logged-in user
export async function getUser() {
  return await getCurrentUser();
}
