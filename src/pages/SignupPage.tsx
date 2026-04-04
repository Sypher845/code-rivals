import type { FormEvent } from "react";
import type { SignUpFormState } from "../App";
import { AuthLayout } from "../components/AuthLayout";
import { inputClass, primaryActionClass } from "../components/uiClasses";

type SignupPageProps = {
  canSubmit: boolean;
  onFieldChange: (field: keyof SignUpFormState, value: string) => void;
  onLoginClick: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  signUpForm: SignUpFormState;
  statusMessage: string;
  statusTone: "error" | "neutral";
  submitting: "login" | "signup" | "logout" | null;
};

export function SignupPage({
  canSubmit,
  onFieldChange,
  onLoginClick,
  onSubmit,
  signUpForm,
  statusMessage,
  statusTone,
  submitting,
}: SignupPageProps) {
  return (
    <AuthLayout
      activeTab="signup"
      helperMessage="Create a username, email, and password. We store your account inside SpacetimeDB and use your connection identity for the live session."
      onTabChange={(tab) => {
        if (tab === "login") {
          onLoginClick();
        }
      }}
      statusMessage={statusMessage}
      statusTone={statusTone}
      title="CREATE YOUR CODERIVAL IDENTITY"
    >
      <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex flex-col gap-[0.65rem]">
          <span className="font-[var(--font-mono)] text-[0.92rem] font-semibold tracking-[0.22em] text-[var(--on-background)]">
            USERNAME
          </span>
          <input
            className={inputClass}
            type="text"
            autoComplete="username"
            value={signUpForm.username}
            onChange={(event) => onFieldChange("username", event.target.value)}
            placeholder="Sypher_845"
            disabled={!canSubmit}
          />
        </label>

        <label className="flex flex-col gap-[0.65rem]">
          <span className="font-[var(--font-mono)] text-[0.92rem] font-semibold tracking-[0.22em] text-[var(--on-background)]">
            EMAIL
          </span>
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={signUpForm.email}
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
            autoComplete="new-password"
            value={signUpForm.password}
            onChange={(event) => onFieldChange("password", event.target.value)}
            placeholder="........"
            disabled={!canSubmit}
          />
        </label>

        <label className="flex flex-col gap-[0.65rem]">
          <span className="font-[var(--font-mono)] text-[0.92rem] font-semibold tracking-[0.22em] text-[var(--on-background)]">
            CONFIRM PASSWORD
          </span>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            value={signUpForm.confirmPassword}
            onChange={(event) =>
              onFieldChange("confirmPassword", event.target.value)
            }
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
            : submitting === "signup"
              ? "Signing up..."
              : "Sign up"}
        </button>
      </form>
    </AuthLayout>
  );
}
