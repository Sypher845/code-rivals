import { t, table } from "spacetimedb/server";

export const arena_room = table(
  {
    name: "arena_room",
    public: true,
  },
  {
    roomId: t.string().primaryKey(),
    creatorIdentity: t.identity(),
    creatorName: t.string(),
    matchState: t.string(),
    createdAt: t.timestamp(),
    startedAt: t.timestamp().optional(),
  },
);

export const arena_room_member = table(
  {
    name: "arena_room_member",
    public: true,
  },
  {
    memberId: t.u64().primaryKey().autoInc(),
    roomId: t.string(),
    memberIdentity: t.identity(),
    memberName: t.string(),
    membershipKey: t.string().unique(),
    joinedAt: t.timestamp(),
  },
);
