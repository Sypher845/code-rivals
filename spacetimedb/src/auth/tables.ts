import { t, table } from "spacetimedb/server";

export const auth_account = table(
  { name: "auth_account" },
  {
    id: t.u64().autoInc(),
    username: t.string(),
    usernameKey: t.string().primaryKey().unique(),
    email: t.string().unique(),
    passwordDigest: t.string(),
    createdAt: t.timestamp(),
    updatedAt: t.timestamp(),
  },
);

export const auth_session = table(
  { name: "auth_session", public: true },
  {
    sessionIdentity: t.identity().primaryKey(),
    username: t.string(),
    connected: t.bool(),
    authenticatedAt: t.timestamp(),
    lastSeenAt: t.timestamp(),
  },
);
