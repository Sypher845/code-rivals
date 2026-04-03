import type { FormEvent } from "react";
import type { LoginFormState } from "../App";
import { AuthLayout } from "../components/AuthLayout";
import { inputClass, primaryActionClass } from "../components/uiClasses";

type LoginPageProps = {
  canSubmit: boolean;
  loginForm: LoginFormState;
  onFieldChange: (field: keyof LoginFormState, value: string) => void;
  onSignupClick: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  shortIdentity: string;
  statusMessage: string;
  statusTone: "error" | "neutral";
  submitting: "login" | "signup" | "logout" | null;
};

export function LoginPage({
  canSubmit,
  loginForm,
  onFieldChange,
  onSignupClick,
  onSubmit,
  shortIdentity,
  statusMessage,
  statusTone,
  submitting,
}: LoginPageProps) {
  return (
    <AuthLayout
      activeTab="login"
      helperMessage="Reconnect with your email and password to relink this live session."
      onTabChange={(tab) => {
        if (tab === "signup") {
          onSignupClick();
        }
      }}
      shortIdentity={shortIdentity}
      statusMessage={statusMessage}
      statusTone={statusTone}
      title="LOG BACK INTO THE CODERIVAL GRID"
    >
      <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-[0.65rem]">
          <span className="font-[var(--font-mono)] text-[0.92rem] font-semibold tracking-[0.22em] text-[var(--on-background)]">
            EMAIL
          </span>
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={loginForm.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
            placeholder="pilot@coderival.dev"
            disabled={!canSubmit}
          />
        </label>

        <label className="flex flex-col gap-[0.65rem]">
          <span className="font-[var(--font-mono)] text-[0.92rem] font-semibold tracking-[0.22em] text-[var(--on-background)]">
            PASSWORD
          </span>
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            value={loginForm.password}
            onChange={(event) => onFieldChange("password", event.target.value)}
            placeholder="........"
            disabled={!canSubmit}
          />
        </label>

        <button
          className={primaryActionClass}
          type="submit"
          disabled={!canSubmit}
        >
          {!canSubmit
            ? "Connecting..."
            : submitting === "login"
              ? "Logging in..."
              : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}
