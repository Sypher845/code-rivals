import { ScheduleAt } from "spacetimedb";
import { type InferSchema, type ReducerCtx } from "spacetimedb/server";
import spacetimedb from "../schema";

type SharedReducerCtx = ReducerCtx<InferSchema<typeof spacetimedb>>;

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function hashToUint32(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function buildMembershipKey(roomId: string, memberIdentityHex: string) {
  return `${roomId}:${memberIdentityHex}`;
}

export function buildPowerupSelectionKey(roomId: string, playerIdentityHex: string) {
  return `${roomId}:${playerIdentityHex}`;
}

export function buildRoundResultKey(
  roomId: string,
  playerIdentityHex: string,
  roundNumber: bigint,
) {
  return `${roomId}:${playerIdentityHex}:${roundNumber.toString()}`;
}

export function listRoomMembers(ctx: SharedReducerCtx, roomId: string) {
  return [...ctx.db.arenaRoomMember.iter()].filter((member) => member.roomId === roomId);
}

export function listPowerupLocks(ctx: SharedReducerCtx, roomId: string) {
  return [...ctx.db.arenaPowerupLock.arena_powerup_lock_room_id.filter(roomId)];
}

export function listRoomTimeoutJobs(ctx: SharedReducerCtx, roomId: string) {
  return [...ctx.db.arenaRoomTimeoutJob.iter()].filter((job) => job.roomId === roomId);
}

export function listRoundIntroJobs(ctx: SharedReducerCtx, roomId: string) {
  return [...ctx.db.arenaRoundIntroJob.iter()].filter((job) => job.roomId === roomId);
}

export function listRoundResults(ctx: SharedReducerCtx, roomId: string) {
  return [...ctx.db.arenaRoundResult.arena_round_result_room_id.filter(roomId)];
}

export function listRoundProblems(ctx: SharedReducerCtx, roomId: string) {
  return [...ctx.db.arenaRoundProblem.arena_round_problem_room_id.filter(roomId)];
}

export function deleteArenaRoomState(ctx: SharedReducerCtx, roomId: string) {
  const roomMembers = listRoomMembers(ctx, roomId);
  for (const member of roomMembers) {
    ctx.db.arenaRoomMember.memberId.delete(member.memberId);
  }

  const powerupLocks = listPowerupLocks(ctx, roomId);
  for (const powerupLock of powerupLocks) {
    ctx.db.arenaPowerupLock.selectionKey.delete(powerupLock.selectionKey);
  }

  const roundResults = listRoundResults(ctx, roomId);
  for (const roundResult of roundResults) {
    ctx.db.arenaRoundResult.resultKey.delete(roundResult.resultKey);
  }

  const roundProblems = listRoundProblems(ctx, roomId);
  for (const roundProblem of roundProblems) {
    ctx.db.arenaRoundProblem.roundProblemKey.delete(roundProblem.roundProblemKey);
  }

  const timeoutJobs = listRoomTimeoutJobs(ctx, roomId);
  for (const timeoutJob of timeoutJobs) {
    ctx.db.arenaRoomTimeoutJob.scheduledId.delete(timeoutJob.scheduledId);
  }

  const roundIntroJobs = listRoundIntroJobs(ctx, roomId);
  for (const roundIntroJob of roundIntroJobs) {
    ctx.db.arenaRoundIntroJob.scheduledId.delete(roundIntroJob.scheduledId);
  }

  ctx.db.arenaRoom.roomId.delete(roomId);
}

export function createWaitingArenaRoom(
  ctx: SharedReducerCtx,
  roomId: string,
  creatorIdentity: SharedReducerCtx["sender"],
  creatorName: string,
) {
  ctx.db.arenaRoom.insert({
    roomId,
    creatorIdentity,
    creatorName,
    matchState: "waiting",
    currentRound: 0n,
    currentQuestionId: undefined,
    draftPlayerOneIdentity: undefined,
    draftPlayerTwoIdentity: undefined,
    rolledPowers: [],
    roundStartTime: undefined,
    roundEndTime: undefined,
    createdAt: ctx.timestamp,
    startedAt: undefined,
  });

  const timeoutAtMicros = ctx.timestamp.microsSinceUnixEpoch + 900_000_000n;
  ctx.db.arenaRoomTimeoutJob.insert({
    scheduledId: 0n,
    scheduledAt: ScheduleAt.time(timeoutAtMicros),
    roomId,
  });

  ctx.db.arenaRoomMember.insert({
    memberId: 0n,
    roomId,
    memberIdentity: creatorIdentity,
    memberName: creatorName,
    membershipKey: buildMembershipKey(roomId, creatorIdentity.toHexString()),
    joinedAt: ctx.timestamp,
  });
}

export function generateInviteRoomId(
  ctx: SharedReducerCtx,
  senderIdentityHex: string,
  receiverIdentityHex: string,
) {
  const baseSeed = `${senderIdentityHex}:${receiverIdentityHex}:${ctx.timestamp.microsSinceUnixEpoch.toString()}`;
  let attempt = 0;

  while (attempt < 64) {
    let state = hashToUint32(`${baseSeed}:${attempt}`);
    let roomId = "";
    for (let index = 0; index < 6; index += 1) {
      roomId += ROOM_ALPHABET[state % ROOM_ALPHABET.length];
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    }

    if (!ctx.db.arenaRoom.roomId.find(roomId)) {
      return roomId;
    }

    attempt += 1;
  }

  let fallback = hashToUint32(`${baseSeed}:fallback`);
  let roomId = "";
  for (let index = 0; index < 6; index += 1) {
    roomId += ROOM_ALPHABET[fallback % ROOM_ALPHABET.length];
    fallback = (Math.imul(fallback, 1103515245) + 12345) >>> 0;
  }
  return roomId;
}
