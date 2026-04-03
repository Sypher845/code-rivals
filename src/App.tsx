import { useEffect, useState, type FormEvent } from "react";
import type { Identity } from "spacetimedb";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useReducer, useSpacetimeDB, useTable } from "spacetimedb/react";
import { reducers, tables } from "./module_bindings";
import { ArenaPage } from "./pages/ArenaPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";

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

function buildUserArenaPath(userSlug: string) {
  return `/user/${encodeURIComponent(userSlug)}`;
}

function isAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/sign-up"
  );
}

type UserArenaRouteProps = {
  expectedSlug: string;
  identity: Identity | undefined;
  isLoggingOut: boolean;
  onLogOut: () => void;
  shortIdentity: string;
  username: string;
};

function UserArenaRoute({
  expectedSlug,
  identity,
  isLoggingOut,
  onLogOut,
  shortIdentity,
  username,
}: UserArenaRouteProps) {
  const params = useParams();
  const requestedSlug = params.slug;

  if (!requestedSlug) {
    return <Navigate replace to={buildUserArenaPath(expectedSlug)} />;
  }

  if (requestedSlug !== expectedSlug) {
    return <Navigate replace to={buildUserArenaPath(expectedSlug)} />;
  }

  return (
    <ArenaPage
      identity={identity}
      isLoggingOut={isLoggingOut}
      onLogOut={onLogOut}
      shortIdentity={shortIdentity}
      userSlug={expectedSlug}
      username={username}
    />
  );
}

function App() {
  const [loginForm, setLoginForm] = useState(defaultLoginForm);
  const [signUpForm, setSignUpForm] = useState(defaultSignUpForm);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<
    "login" | "signup" | "logout" | null
  >(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { identity, isActive: connected, connectionError } = useSpacetimeDB();

  const signUp = useReducer(reducers.signUp);
  const logIn = useReducer(reducers.logIn);
  const logOut = useReducer(reducers.logOut);

  const [sessionRows, sessionReady] = useTable(tables.authSession);
  const session = sessionRows.find((row) =>
    identity ? row.sessionIdentity.isEqual(identity) : false,
  );
  const currentUserSlug = session?.userSlug;
  const sessionArenaPath = currentUserSlug
    ? buildUserArenaPath(currentUserSlug)
    : "/login";

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

  useEffect(() => {
    if (!session || !sessionReady || !currentUserSlug) {
      return;
    }

    if (!isAuthPath(location.pathname) && location.pathname !== "/slug") {
      return;
    }

    const targetPath = buildUserArenaPath(currentUserSlug);
    if (location.pathname === targetPath) {
      return;
    }

    navigate(targetPath, { replace: true });
  }, [currentUserSlug, location.pathname, navigate, session, sessionReady]);

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
      setStatusMessage("Account created. Syncing your user page...");
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
      setStatusMessage("Login successful. Syncing your user page...");
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
      navigate("/");
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
            userSlug={currentUserSlug}
            username={session?.username}
          />
        }
      />
      <Route
        path="/login"
        element={
          session && currentUserSlug ? (
            <Navigate replace to={sessionArenaPath} />
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
          session && currentUserSlug ? (
            <Navigate replace to={sessionArenaPath} />
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
      <Route path="/sign-up" element={<Navigate replace to="/signup" />} />
      <Route
        path="/user/:slug/*"
        element={
          session && currentUserSlug ? (
            <UserArenaRoute
              expectedSlug={currentUserSlug}
              identity={identity}
              isLoggingOut={submitting === "logout"}
              onLogOut={() => {
                void handleLogOut();
              }}
              shortIdentity={shortIdentity}
              username={session.username}
            />
          ) : (
            <Navigate replace to="/login" />
          )
        }
      />
      <Route
        path="/slug"
        element={
          session && currentUserSlug ? (
            <Navigate replace to={sessionArenaPath} />
          ) : (
            <Navigate replace to="/login" />
          )
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            replace
            to={session && currentUserSlug ? sessionArenaPath : "/"}
          />
        }
      />
    </Routes>
  );
}

export default App;
