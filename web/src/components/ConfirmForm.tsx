import { useState } from "react";
import { useAuth } from "../auth/useAuth";

interface ConfirmFormProps {
  email: string;
}

export default function ConfirmForm({ email }: ConfirmFormProps) {
  const { confirm } = useAuth();
  const [code, setCode] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await confirm(email, code);
          alert("Account confirmed! You can now log in.");
        } catch (err) {
          alert("Confirmation failed: " + (err as Error).message);
        }
      }}
      className="space-y-3"
    >
      <p>
        Enter the confirmation code sent to <b>{email}</b>:
      </p>
      <input
        className="border p-2 w-full"
        placeholder="Confirmation code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button
        type="submit"
        className="bg-purple-500 text-white px-4 py-2 rounded"
      >
        Confirm
      </button>
    </form>
  );
}
