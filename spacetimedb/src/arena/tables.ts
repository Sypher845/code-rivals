import { t, table } from "spacetimedb/server";

let timeoutWaitingRoomReducerExport: unknown;

export function register_timeout_waiting_room_export(reducerExport: unknown) {
  timeoutWaitingRoomReducerExport = reducerExport;
}

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

export const arena_room_timeout_job = table(
  {
    name: "arena_room_timeout_job",
    scheduled: () => {
      if (!timeoutWaitingRoomReducerExport) {
        throw new Error("Scheduled reducer export for arena room timeout is not registered.");
      }
      return timeoutWaitingRoomReducerExport as never;
    },
  },
  {
    scheduledId: t.u64().primaryKey().autoInc(),
    scheduledAt: t.scheduleAt(),
    roomId: t.string(),
  },
);

export const arena_room_notice = table(
  {
    name: "arena_room_notice",
    public: true,
  },
  {
    noticeId: t.u64().primaryKey().autoInc(),
    roomId: t.string(),
    noticeType: t.string(),
    message: t.string(),
    createdAt: t.timestamp(),
  },
);
