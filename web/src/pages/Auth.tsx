import { useState } from "react";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import ConfirmForm from "../components/ConfirmForm";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "confirm">("login");
  const [email, setEmail] = useState("");

  return (
    <div className="p-4 max-w-sm mx-auto space-y-6">
      {mode === "login" && <LoginForm onSwitch={() => setMode("signup")} />}
      {mode === "signup" && (
        <SignupForm
          onSwitch={() => setMode("login")}
          onSignedUp={(e) => {
            setEmail(e);
            setMode("confirm");
          }}
        />
      )}
      {mode === "confirm" && <ConfirmForm email={email} />}
    </div>
  );
}
