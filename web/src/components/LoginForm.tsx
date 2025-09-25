import { useState } from "react";
import { useAuth } from "../auth/useAuth";

interface LoginFormProps {
  onSwitch: () => void;
}

export default function LoginForm({ onSwitch }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await login(email, password);
        } catch (err) {
          alert("Login failed: " + (err as Error).message);
        }
      }}
      className="space-y-3"
    >
      <input
        className="border p-2 w-full"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="border p-2 w-full"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex justify-between items-center">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Login
        </button>
        <button
          type="button"
          onClick={onSwitch}
          className="text-sm text-blue-500"
        >
          Signup
        </button>
      </div>
    </form>
  );
}
