import { useState } from "react";
import { useAuth } from "../auth/useAuth";

interface SignupFormProps {
  onSwitch: () => void;
  onSignedUp: (email: string) => void;
}

export default function SignupForm({ onSwitch, onSignedUp }: SignupFormProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await register(email, password, name);
          onSignedUp(email);
        } catch (err) {
          alert("Signup failed: " + (err as Error).message);
        }
      }}
      className="space-y-3"
    >
      <input
        className="border p-2 w-full"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Signup
        </button>
        <button
          type="button"
          onClick={onSwitch}
          className="text-sm text-blue-500"
        >
          Back to login
        </button>
      </div>
    </form>
  );
}
