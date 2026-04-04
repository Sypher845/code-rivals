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

import { PowerupReadyPage } from "./pages/PowerupReadyPage";
import { PowerupSelectionPage } from "./pages/PowerSelectionPage";
import { CodingWindowPage } from "./pages/CodingWindowPage";
import { ArenaResultsPage } from "./pages/ArenaResultsPage";
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

function buildUserArenaPath(username: string) {
  return `/${encodeURIComponent(username)}`;
}

function isAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/sign-up"
  );
}

type UserArenaRouteProps = {
  expectedUsername: string;
  identity: Identity | undefined;
  isLoggingOut: boolean;
  onLogOut: () => void;
  shortIdentity: string;
  username: string;
};

function UserArenaRoute({
  expectedUsername,
  identity,
  isLoggingOut,
  onLogOut,
  shortIdentity,
  username,
}: UserArenaRouteProps) {
  const params = useParams();
  const requestedUsername = params.username;

  if (!requestedUsername) {
    console.warn(
      "[Auth] missing username in path, redirecting to canonical user route",
      {
        expectedUsername,
      },
    );
    return <Navigate replace to={buildUserArenaPath(expectedUsername)} />;
  }

  if (requestedUsername !== expectedUsername) {
    console.warn(
      "[Auth] username mismatch, rewriting URL to authenticated username",
      {
        requestedUsername,
        expectedUsername,
      },
    );
    return <Navigate replace to={buildUserArenaPath(expectedUsername)} />;
  }

  return (
    <ArenaPage
      identity={identity}
      isLoggingOut={isLoggingOut}
      onLogOut={onLogOut}
      shortIdentity={shortIdentity}
      username={username}
    />
  );
}

type UserPowerupRouteProps = {
  expectedUsername: string;
  identity: Identity | undefined;
  username: string;
};

function UserPowerupRoute({
  expectedUsername,
  identity,
  username,
}: UserPowerupRouteProps) {
  const params = useParams();
  const requestedUsername = params.username;

  if (!requestedUsername) {
    return <Navigate replace to={buildUserArenaPath(expectedUsername)} />;
  }

  if (requestedUsername !== expectedUsername) {
    return <Navigate replace to={buildUserArenaPath(expectedUsername)} />;
  }

  return <PowerupSelectionPage identity={identity} username={username} />;
}

function UserPowerupReadyRoute({
  expectedUsername,
  identity,
  username,
}: UserPowerupRouteProps) {
  const params = useParams();
  const requestedUsername = params.username;

  if (!requestedUsername) {
    return <Navigate replace to={buildUserArenaPath(expectedUsername)} />;
  }

  if (requestedUsername !== expectedUsername) {
    return <Navigate replace to={buildUserArenaPath(expectedUsername)} />;
  }

  return <PowerupReadyPage identity={identity} username={username} />;
}

function UserArenaResultsRoute({
  expectedUsername,
}: {
  expectedUsername: string;
}) {
  const params = useParams();
  const requestedUsername = params.username;

  if (!requestedUsername) {
    return <Navigate replace to={buildUserArenaPath(expectedUsername)} />;
  }

  if (requestedUsername !== expectedUsername) {
    return <Navigate replace to={buildUserArenaPath(expectedUsername)} />;
  }

  return <ArenaResultsPage />;
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
  const currentUsername = session?.username;
  const sessionArenaPath = currentUsername
    ? buildUserArenaPath(currentUsername)
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
    console.debug("[Auth] subscription snapshot", {
      connected,
      hasIdentity: Boolean(identity),
      sessionReady,
      hasSession: Boolean(session),
      currentPath: location.pathname,
      sessionUsername: currentUsername,
    });
  }, [
    connected,
    currentUsername,
    identity,
    location.pathname,
    session,
    sessionReady,
  ]);

  useEffect(() => {
    if (!session || !sessionReady || !currentUsername) {
      return;
    }

    if (!isAuthPath(location.pathname)) {
      return;
    }

    const targetPath = buildUserArenaPath(currentUsername);
    if (location.pathname === targetPath) {
      return;
    }

    console.info("[Auth] redirecting to username page", {
      from: location.pathname,
      to: targetPath,
      username: currentUsername,
    });
    navigate(targetPath, { replace: true });
  }, [
    currentUsername,
    location.pathname,
    navigate,
    session,
    sessionReady,
  ]);

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
      console.info(
        "[Auth] sign-up reducer succeeded; waiting for authenticated username.",
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
      console.error("[Auth] sign-up reducer failed", error);
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
      console.info(
        "[Auth] log-in reducer succeeded; waiting for authenticated username.",
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
      console.error("[Auth] log-in reducer failed", error);
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
      console.info("[Auth] session closed and redirected to landing.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to close the session.",
      );
      console.error("[Auth] log-out reducer failed", error);
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
            username={session?.username}
          />
        }
      />
      <Route
        path="/login"
        element={
          session && currentUsername ? (
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
          session && currentUsername ? (
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
      <Route path="/coding-window" element={<CodingWindowPage />} />
      <Route
        path="/:username/:roomSegment/:roundSegment/power-cards-locked"
        element={
          session && currentUsername ? (
            <UserPowerupReadyRoute
              expectedUsername={currentUsername}
              identity={identity}
              username={session.username}
            />
          ) : (
            <Navigate replace to="/login" />
          )
        }
      />
      <Route
        path="/:username/:roomSegment/:roundSegment/power-cards"
        element={
          session && currentUsername ? (
            <UserPowerupRoute
              expectedUsername={currentUsername}
              identity={identity}
              username={session.username}
            />
          ) : (
            <Navigate replace to="/login" />
          )
        }
      />
      <Route
        path="/:username/:roomSegment/results"
        element={
          session && currentUsername ? (
            <UserArenaResultsRoute expectedUsername={currentUsername} />
          ) : (
            <Navigate replace to="/login" />
          )
        }
      />
      <Route
        path="/:username/:roomSegment/:roundSegment"
        element={
          session && currentUsername ? (
            <CodingWindowPage />
          ) : (
            <Navigate replace to="/login" />
          )
        }
      />
      <Route
        path="/:username/*"
        element={
          session && currentUsername ? (
            <UserArenaRoute
              expectedUsername={currentUsername}
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
        path="*"
        element={
          <Navigate
            replace
            to={session && currentUsername ? sessionArenaPath : "/"}
          />
        }
      />
    </Routes>
  );
}

export default App;
