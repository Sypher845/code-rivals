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
} from "./validation";
import {
  PLAYER_ACTIVITY,
  cancelPendingInvitesForSender,
  upsertPresence,
} from "../social/shared";

type AuthReducerCtx = ReducerCtx<InferSchema<typeof spacetimedb>>;

function ensurePlayerProfile(ctx: AuthReducerCtx, username: string) {
  const usernameKey = normalizeUsernameKey(username);
  const existingProfile = ctx.db.playerProfile.usernameKey.find(usernameKey);
  if (existingProfile) {
    return existingProfile;
  }

  return ctx.db.playerProfile.insert({
    usernameKey,
    username,
    eloRating: 400n,
    matchesPlayed: 0n,
    wins: 0n,
    losses: 0n,
    updatedAt: ctx.timestamp,
  });
}

function upsertSession(ctx: AuthReducerCtx, username: string) {
  const session = ctx.db.authSession.sessionIdentity.find(ctx.sender);
  const existingPresence = ctx.db.playerPresence.playerIdentity.find(ctx.sender);

  if (session) {
    ctx.db.authSession.sessionIdentity.update({
      ...session,
      username,
      connected: true,
      lastSeenAt: ctx.timestamp,
    });
    upsertPresence(
      ctx,
      ctx.sender,
      username,
      true,
      existingPresence?.activity ?? PLAYER_ACTIVITY.idle,
      existingPresence?.currentRoomId,
    );
    return;
  }

  ctx.db.authSession.insert({
    sessionIdentity: ctx.sender,
    username,
    connected: true,
    authenticatedAt: ctx.timestamp,
    lastSeenAt: ctx.timestamp,
  });
  upsertPresence(
    ctx,
    ctx.sender,
    username,
    true,
    existingPresence?.activity ?? PLAYER_ACTIVITY.idle,
    existingPresence?.currentRoomId,
  );
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

    ctx.db.authAccount.insert({
      id: 0n,
      username: normalizedUsername,
      usernameKey: normalizedUsernameKey,
      email: normalizedEmail,
      passwordDigest: digestPassword(password),
      createdAt: ctx.timestamp,
      updatedAt: ctx.timestamp,
    });

    ensurePlayerProfile(ctx, normalizedUsername);

    upsertSession(ctx, normalizedUsername);

    console.log(`[Auth] sign-up success username=${normalizedUsername}`);
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

    ensurePlayerProfile(ctx, account.username);
    upsertSession(ctx, account.username);

    console.log(`[Auth] log-in success username=${account.username}`);
  },
);

export const log_out = spacetimedb.reducer((ctx) => {
  const session = ctx.db.authSession.sessionIdentity.find(ctx.sender);
  if (session) {
    cancelPendingInvitesForSender(
      ctx,
      ctx.sender,
      "cancelled",
      `${session.username} is no longer available for that invite.`,
    );
    upsertPresence(ctx, ctx.sender, session.username, false, PLAYER_ACTIVITY.offline);
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

  ensurePlayerProfile(ctx, account.username);
  ctx.db.authSession.sessionIdentity.update({
    ...session,
    username: account.username,
    connected: true,
    lastSeenAt: ctx.timestamp,
  });
  const presence = ctx.db.playerPresence.playerIdentity.find(ctx.sender);
  upsertPresence(
    ctx,
    ctx.sender,
    account.username,
    true,
    presence?.activity ?? PLAYER_ACTIVITY.idle,
    presence?.currentRoomId,
  );

  console.log(`[Auth] client connected username=${account.username}`);
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
  cancelPendingInvitesForSender(
    ctx,
    ctx.sender,
    "expired",
    `${session.username} went offline before the match could begin.`,
  );
  upsertPresence(ctx, ctx.sender, session.username, false, PLAYER_ACTIVITY.offline);
  console.log(`[Auth] client disconnected username=${session.username}`);
});
