import {
  SenderError,
  t,
  type InferSchema,
  type ReducerCtx,
} from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  digestPassword,
  normalizeUsernameKey,
  validateLoginInput,
  validateSignUpInput,
} from "./validation.ts";

type AuthReducerCtx = ReducerCtx<InferSchema<typeof spacetimedb>>;

function buildSlugCandidate(seed: string) {
  const front = digestPassword(seed);
  const back = digestPassword(seed.split("").reverse().join(""));
  return `usr_${front}${back.slice(0, 8)}`;
}

function allocateUserSlug(
  ctx: AuthReducerCtx,
  normalizedUsernameKey: string,
  normalizedEmail: string,
) {
  const baseSeed = [
    ctx.sender.toHexString(),
    normalizedUsernameKey,
    normalizedEmail,
    ctx.timestamp.microsSinceUnixEpoch.toString(),
  ].join("|");

  for (let attempt = 0; attempt < 2048; attempt += 1) {
    const candidate = buildSlugCandidate(`${baseSeed}|${attempt.toString(16)}`);
    if (!ctx.db.authAccount.userSlug.find(candidate)) {
      return candidate;
    }
  }

  throw new SenderError("Unable to allocate user slug. Please retry signup.");
}

function upsertSession(ctx: AuthReducerCtx, username: string, userSlug: string) {
  const session = ctx.db.authSession.sessionIdentity.find(ctx.sender);

  if (session) {
    ctx.db.authSession.sessionIdentity.update({
      ...session,
      userSlug,
      username,
      connected: true,
      lastSeenAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.authSession.insert({
    sessionIdentity: ctx.sender,
    userSlug,
    username,
    connected: true,
    authenticatedAt: ctx.timestamp,
    lastSeenAt: ctx.timestamp,
  });
}

export const sign_up = spacetimedb.reducer(
  {
    username: t.string(),
    email: t.string(),
    password: t.string(),
    confirmPassword: t.string(),
  },
  (ctx, { username, email, password, confirmPassword }) => {
    if (ctx.db.authSession.sessionIdentity.find(ctx.sender)) {
      throw new SenderError(
        "This SpacetimeDB identity is already linked. Log out before creating another account.",
      );
    }

    const { normalizedUsername, normalizedUsernameKey, normalizedEmail } =
      validateSignUpInput({ username, email, password, confirmPassword });

    if (ctx.db.authAccount.usernameKey.find(normalizedUsernameKey)) {
      throw new SenderError("That username is already claimed.");
    }

    if (ctx.db.authAccount.email.find(normalizedEmail)) {
      throw new SenderError("That email is already registered.");
    }

    const userSlug = allocateUserSlug(
      ctx,
      normalizedUsernameKey,
      normalizedEmail,
    );

    ctx.db.authAccount.insert({
      id: 0n,
      userSlug,
      username: normalizedUsername,
      usernameKey: normalizedUsernameKey,
      email: normalizedEmail,
      passwordDigest: digestPassword(password),
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });

    upsertSession(ctx, normalizedUsername, userSlug);

    console.log(
      `[Auth] sign-up success username=${normalizedUsername} slug=${userSlug}`,
    );
  },
);

export const log_in = spacetimedb.reducer(
  { email: t.string(), password: t.string() },
  (ctx, { email, password }) => {
    const { normalizedEmail } = validateLoginInput({ email, password });
    const account = ctx.db.authAccount.email.find(normalizedEmail);

    if (!account || account.passwordDigest !== digestPassword(password)) {
      throw new SenderError("Authentication failed.");
    }

    ctx.db.authAccount.usernameKey.update({
      ...account,
      updatedAt: ctx.timestamp,
    });

    upsertSession(ctx, account.username, account.userSlug);

    console.log(
      `[Auth] log-in success username=${account.username} slug=${account.userSlug}`,
    );
  },
);

export const log_out = spacetimedb.reducer((ctx) => {
  const session = ctx.db.authSession.sessionIdentity.find(ctx.sender);
  if (session) {
    ctx.db.authSession.sessionIdentity.delete(ctx.sender);
    console.log(`[Auth] log-out success username=${session.username}`);
  }
});

export const on_connect = spacetimedb.clientConnected((ctx) => {
  const session = ctx.db.authSession.sessionIdentity.find(ctx.sender);
  if (!session) {
    return;
  }

  const account = ctx.db.authAccount.usernameKey.find(
    normalizeUsernameKey(session.username),
  );
  if (!account) {
    console.warn(
      `[Auth] connected session has no matching account username=${session.username}`,
    );

    ctx.db.authSession.sessionIdentity.update({
      ...session,
      connected: true,
      lastSeenAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.authSession.sessionIdentity.update({
    ...session,
    userSlug: account.userSlug,
    connected: true,
    lastSeenAt: ctx.timestamp,
  });

  console.log(
    `[Auth] client connected username=${session.username} slug=${account.userSlug}`,
  );
});

export const on_disconnect = spacetimedb.clientDisconnected((ctx) => {
  const session = ctx.db.authSession.sessionIdentity.find(ctx.sender);
  if (!session) {
    return;
  }

  ctx.db.authSession.sessionIdentity.update({
    ...session,
    connected: false,
    lastSeenAt: ctx.timestamp,
  });
  console.log(`[Auth] client disconnected username=${session.username}`);
});
