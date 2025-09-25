import { useEffect, useState } from "react";
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
} from "@aws-amplify/auth";

export interface User {
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        const email = u?.signInDetails?.loginId;
        if (email) setUser({ email });
        else setUser(null);
      })
      .catch(() => setUser(null));
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signIn({ username: email, password });
    if (!result.isSignedIn) {
      throw new Error(
        "Sign-in incomplete, next step required: " +
          JSON.stringify(result.nextStep)
      );
    }

    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (!idToken) throw new Error("No ID token found");
    localStorage.setItem("authToken", idToken);
    document.cookie = `authToken=${idToken}; path=/; secure; sameSite=Strict`;

    setUser({ email });
  };

  const logout = async () => {
    await signOut();
    localStorage.removeItem("authToken");
    setUser(null);
  };

  const register = async (email: string, password: string, name: string) => {
    return await signUp({
      username: email,
      password,
      options: { userAttributes: { email, name } },
    });
  };

  const confirm = async (email: string, code: string) => {
    return await confirmSignUp({ username: email, confirmationCode: code });
  };

  return { user, login, logout, register, confirm };
}
