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
    currentRound: t.u64(),
    currentQuestionId: t.string().optional(),
    draftPlayerOneIdentity: t.identity().optional(),
    draftPlayerTwoIdentity: t.identity().optional(),
    rolledPowers: t.array(t.string()),
    roundStartTime: t.timestamp().optional(),
    roundEndTime: t.timestamp().optional(),
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

export const arena_powerup_lock = table(
  {
    name: "arena_powerup_lock",
    public: true,
    indexes: [
      {
        accessor: "arena_powerup_lock_room_id",
        name: "arena_powerup_lock_room_id",
        algorithm: "btree",
        columns: ["roomId"],
      },
    ],
  },
  {
    selectionKey: t.string().primaryKey(),
    roomId: t.string(),
    playerIdentity: t.identity(),
    powerupId: t.string().optional(),
    isReady: t.bool(),
    hasLockedPower: t.bool(),
    activeDebuffs: t.array(t.string()),
    hasSubmitted: t.bool(),
    isTyping: t.bool(),
    lockedAt: t.timestamp().optional(),
  },
);

export const arena_round_result = table(
  {
    name: "arena_round_result",
    public: true,
    indexes: [
      {
        accessor: "arena_round_result_room_id",
        name: "arena_round_result_room_id",
        algorithm: "btree",
        columns: ["roomId"],
      },
    ],
  },
  {
    resultKey: t.string().primaryKey(),
    roomId: t.string(),
    playerIdentity: t.identity(),
    roundNumber: t.u64(),
    powerUsed: t.string(),
    timeTakenSeconds: t.u64(),
    testcasesPassed: t.u64(),
    totalTestcases: t.u64(),
    pointsEarned: t.u64(),
    createdAt: t.timestamp(),
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
