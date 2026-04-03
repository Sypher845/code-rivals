import { useState, type FormEvent } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useReducer, useSpacetimeDB, useTable } from "spacetimedb/react";
import { reducers, tables } from "./module_bindings";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { LandingPage } from "./pages/LandingPage";

export type LoginFormState = {
  email: string;
  password: string;
};

export type SignUpFormState = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const defaultLoginForm: LoginFormState = {
  email: "",
  password: "",
};

const defaultSignUpForm: SignUpFormState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function App() {
  const [loginForm, setLoginForm] = useState(defaultLoginForm);
  const [signUpForm, setSignUpForm] = useState(defaultSignUpForm);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<
    "login" | "signup" | "logout" | null
  >(null);

  const navigate = useNavigate();
  const { identity, isActive: connected, connectionError } = useSpacetimeDB();

  const signUp = useReducer(reducers.signUp);
  const logIn = useReducer(reducers.logIn);
  const logOut = useReducer(reducers.logOut);

  const [sessionRows, sessionReady] = useTable(tables.authSession);
  const session = sessionRows.find((row) =>
    identity ? row.sessionIdentity.isEqual(identity) : false,
  );

  const shortIdentity = identity?.toHexString().slice(0, 12) ?? "syncing";
  const isBusy = submitting !== null;
  const canSubmit = connected && !isBusy;
  const statusTone = statusMessage || connectionError ? "error" : "neutral";
  const resolvedStatusMessage =
    statusMessage ??
    connectionError?.message ??
    (!connected
      ? "Establishing SpacetimeDB uplink..."
      : !identity
        ? "Waiting for session identity..."
        : !sessionReady
          ? "Loading auth session table..."
          : "No linked account yet. Use Sign up or Log in.");

  const handleTabChange = (tab: "login" | "signup") => {
    navigate(tab === "signup" ? "/signup" : "/login");
    setStatusMessage(null);
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting("signup");
    setStatusMessage(null);

    try {
      await signUp(signUpForm);
      setSignUpForm(defaultSignUpForm);
      setStatusMessage("Account created successfully.");
      navigate("/", { replace: true });
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleLogIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting("login");
    setStatusMessage(null);

    try {
      await logIn(loginForm);
      setLoginForm(defaultLoginForm);
      setStatusMessage("Login successful.");
      navigate("/", { replace: true });
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleLogOut = async () => {
    setSubmitting("logout");
    setStatusMessage(null);

    try {
      await logOut();
      navigate("/", { replace: true });
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to close the session.",
      );
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            isAuthenticated={Boolean(session)}
            userSlug={session?.userSlug}
            username={session?.username}
          />
        }
      />
      <Route
        path="/login"
        element={
          session ? (
            <Navigate replace to="/" />
          ) : (
            <LoginPage
              canSubmit={canSubmit}
              loginForm={loginForm}
              onFieldChange={(field, value) => {
                setLoginForm((current) => ({ ...current, [field]: value }));
              }}
              onSignupClick={() => handleTabChange("signup")}
              onSubmit={handleLogIn}
              shortIdentity={shortIdentity}
              statusMessage={resolvedStatusMessage}
              statusTone={statusTone}
              submitting={submitting}
            />
          )
        }
      />
      <Route
        path="/signup"
        element={
          session ? (
            <Navigate replace to="/" />
          ) : (
            <SignupPage
              canSubmit={canSubmit}
              onFieldChange={(field, value) => {
                setSignUpForm((current) => ({ ...current, [field]: value }));
              }}
              onLoginClick={() => handleTabChange("login")}
              onSubmit={handleSignUp}
              shortIdentity={shortIdentity}
              signUpForm={signUpForm}
              statusMessage={resolvedStatusMessage}
              statusTone={statusTone}
              submitting={submitting}
            />
          )
        }
      />
      <Route
        path="/logout"
        element={
          session ? (
            <LogoutPage
              isBusy={submitting === "logout"}
              onLogOut={() => {
                void handleLogOut();
              }}
              username={session.username}
            />
          ) : (
            <Navigate replace to="/" />
          )
        }
      />
      <Route path="/sign-up" element={<Navigate replace to="/signup" />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

function LogoutPage({
  isBusy,
  onLogOut,
  username,
}: {
  isBusy: boolean;
  onLogOut: () => void;
  username: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--arena-border)] bg-[var(--arena-surface-1)] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.34)]">
        <p className="font-[var(--font-mono)] text-[0.78rem] tracking-[0.2em] text-[var(--secondary)] uppercase">
          Session Ready
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] uppercase">
          Welcome, {username}
        </h1>
        <p className="mt-4 text-[var(--text-secondary)]">
          You are signed in. Head back to the landing page or close this
          session.
        </p>
        <button
          className="mt-6 min-h-[3.2rem] rounded-xl border border-[rgba(224,141,255,0.32)] bg-[rgba(29,18,39,0.52)] px-5 font-[var(--font-mono)] text-sm tracking-[0.08em] text-[var(--on-background)] uppercase transition hover:bg-[rgba(45,22,41,0.72)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={isBusy}
          onClick={onLogOut}
        >
          {isBusy ? "Logging out..." : "Log out"}
        </button>
      </div>
    </main>
  );
}

export default App;
