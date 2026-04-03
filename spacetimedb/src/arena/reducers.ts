import { ScheduleAt } from "spacetimedb";
import {
  SenderError,
  t,
  type InferSchema,
  type ReducerCtx,
} from "spacetimedb/server";
import spacetimedb from "../schema";
import {
  arena_powerup_lock,
  arena_room_timeout_job,
  register_timeout_waiting_room_export,
} from "./tables";

type ArenaReducerCtx = ReducerCtx<InferSchema<typeof spacetimedb>>;

const POWER_CARD_NAMES = [
  "FlashbangCard",
  "KeySwapCard",
  "LineJumperCard",
  "MirrorShieldCard",
  "NoMistakesCard",
  "SkullCard",
  "TimeHeistCard",
  "TimeKumCard",
  "VisuallyImpairedCard",
] as const;

function hashToUint32(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextUint32(state: number) {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function buildRolledPowers(
  roomId: string,
  playerOneIdentityHex: string,
  playerTwoIdentityHex: string,
  timestampMicros: bigint,
) {
  const seedMaterial = `${roomId}:${playerOneIdentityHex}:${playerTwoIdentityHex}:${timestampMicros.toString()}`;
  let state = hashToUint32(seedMaterial);

  const shuffled = [...POWER_CARD_NAMES];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = nextUint32(state);
    const swapIndex = state % (index + 1);
    const currentValue = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = currentValue;
  }

  return shuffled.slice(0, 3);
}

function requireSession(ctx: ArenaReducerCtx) {
  const session = ctx.db.authSession.sessionIdentity.find(ctx.sender);
  if (!session) {
    throw new SenderError("Log in before using arena rooms.");
  }
  return session;
}

function normalizeRoomId(rawRoomId: string) {
  const normalized = rawRoomId.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(normalized)) {
    throw new SenderError("Room ID must be exactly 6 letters or numbers.");
  }
  return normalized;
}

function buildMembershipKey(roomId: string, memberIdentityHex: string) {
  return `${roomId}:${memberIdentityHex}`;
}

function buildPowerupSelectionKey(roomId: string, playerIdentityHex: string) {
  return `${roomId}:${playerIdentityHex}`;
}

function listRoomMembers(ctx: ArenaReducerCtx, roomId: string) {
  return [...ctx.db.arenaRoomMember.iter()].filter(
    (member) => member.roomId === roomId,
  );
}

function listPowerupLocks(ctx: ArenaReducerCtx, roomId: string) {
  return [...ctx.db.arenaPowerupLock.arena_powerup_lock_room_id.filter(roomId)];
}

function listRoomTimeoutJobs(ctx: ArenaReducerCtx, roomId: string) {
  return [...ctx.db.arenaRoomTimeoutJob.iter()].filter(
    (job) => job.roomId === roomId,
  );
}

function deleteRoomAndMembers(ctx: ArenaReducerCtx, roomId: string) {
  const roomMembers = listRoomMembers(ctx, roomId);
  for (const member of roomMembers) {
    ctx.db.arenaRoomMember.memberId.delete(member.memberId);
  }

  const powerupLocks = listPowerupLocks(ctx, roomId);
  for (const powerupLock of powerupLocks) {
    ctx.db.arenaPowerupLock.selectionKey.delete(powerupLock.selectionKey);
  }

  const timeoutJobs = listRoomTimeoutJobs(ctx, roomId);
  for (const timeoutJob of timeoutJobs) {
    ctx.db.arenaRoomTimeoutJob.scheduledId.delete(timeoutJob.scheduledId);
  }

  ctx.db.arenaRoom.roomId.delete(roomId);
}

export const create_arena_room = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    const session = requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);

    if (ctx.db.arenaRoom.roomId.find(normalizedRoomId)) {
      throw new SenderError("This room ID is already in use.");
    }

    ctx.db.arenaRoom.insert({
      roomId: normalizedRoomId,
      creatorIdentity: ctx.sender,
      creatorName: session.username,
      matchState: "waiting",
      draftPlayerOneIdentity: undefined,
      draftPlayerTwoIdentity: undefined,
      rolledPowers: [],
      createdAt: ctx.timestamp,
      startedAt: undefined,
    });

    const timeoutAtMicros =
      ctx.timestamp.microsSinceUnixEpoch + 900_000_000n;
    ctx.db.arenaRoomTimeoutJob.insert({
      scheduledId: 0n,
      scheduledAt: ScheduleAt.time(timeoutAtMicros),
      roomId: normalizedRoomId,
    });

    ctx.db.arenaRoomMember.insert({
      memberId: 0n,
      roomId: normalizedRoomId,
      memberIdentity: ctx.sender,
      memberName: session.username,
      membershipKey: buildMembershipKey(normalizedRoomId, ctx.sender.toHexString()),
      joinedAt: ctx.timestamp,
    });

    console.log(
      `[Arena] room created room_id=${normalizedRoomId} creator=${session.username}`,
    );
  },
);

export const delete_arena_room = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    if (!room.creatorIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Only the room creator can delete this room.");
    }

    deleteRoomAndMembers(ctx, normalizedRoomId);
    console.log(`[Arena] room deleted room_id=${normalizedRoomId} by creator`);
  },
);

export const timeout_waiting_room = spacetimedb.reducer(
  { arg: arena_room_timeout_job.rowType },
  (ctx, { arg }) => {
    const room = ctx.db.arenaRoom.roomId.find(arg.roomId);
    if (!room) {
      return;
    }

    if (room.matchState !== "waiting") {
      return;
    }

    deleteRoomAndMembers(ctx, room.roomId);

    ctx.db.arenaRoomNotice.insert({
      noticeId: 0n,
      roomId: room.roomId,
      noticeType: "timeout_deleted",
      message: `Room ${room.roomId} was deleted after waiting 15 minutes.`,
      createdAt: ctx.timestamp,
    });

    console.log(`[Arena] room timed out room_id=${room.roomId}`);
  },
);

register_timeout_waiting_room_export(timeout_waiting_room);

export const join_arena_room = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    const session = requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);

    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    if (room.matchState === "started") {
      throw new SenderError("This match has already started.");
    }

    const membershipKey = buildMembershipKey(
      normalizedRoomId,
      ctx.sender.toHexString(),
    );
    if (ctx.db.arenaRoomMember.membershipKey.find(membershipKey)) {
      return;
    }

    const roomMembers = listRoomMembers(ctx, normalizedRoomId);
    if (roomMembers.length >= 2) {
      throw new SenderError("Room is full.");
    }

    ctx.db.arenaRoomMember.insert({
      memberId: 0n,
      roomId: normalizedRoomId,
      memberIdentity: ctx.sender,
      memberName: session.username,
      membershipKey,
      joinedAt: ctx.timestamp,
    });

    console.log(
      `[Arena] member joined room_id=${normalizedRoomId} username=${session.username}`,
    );
  },
);

export const start_arena_match = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    if (!room.creatorIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Only the room creator can start the match.");
    }

    const roomMembers = listRoomMembers(ctx, normalizedRoomId);
    if (roomMembers.length < 2) {
      throw new SenderError("At least two users are required to start.");
    }

    const playerOne =
      roomMembers.find((member) => member.memberIdentity.isEqual(room.creatorIdentity)) ??
      roomMembers[0];
    const playerTwo = roomMembers.find(
      (member) => !member.memberIdentity.isEqual(playerOne.memberIdentity),
    );
    if (!playerTwo) {
      throw new SenderError("Unable to resolve both players for this room.");
    }

    if (room.matchState === "started") {
      return;
    }

    const rolledPowers = buildRolledPowers(
      room.roomId,
      playerOne.memberIdentity.toHexString(),
      playerTwo.memberIdentity.toHexString(),
      ctx.timestamp.microsSinceUnixEpoch,
    );

    ctx.db.arenaRoom.roomId.update({
      ...room,
      matchState: "started",
      draftPlayerOneIdentity: playerOne.memberIdentity,
      draftPlayerTwoIdentity: playerTwo.memberIdentity,
      rolledPowers,
      startedAt: ctx.timestamp,
    });

    console.log(`[Arena] match started room_id=${normalizedRoomId}`);
  },
);

export const lock_arena_powerup = spacetimedb.reducer(
  {
    roomId: t.string(),
    powerupId: t.string(),
  },
  (ctx, { roomId, powerupId }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    if (room.matchState !== "started") {
      throw new SenderError("Match is not ready for powerup locking.");
    }

    const isDraftPlayerOne = room.draftPlayerOneIdentity?.isEqual(ctx.sender) ?? false;
    const isDraftPlayerTwo = room.draftPlayerTwoIdentity?.isEqual(ctx.sender) ?? false;
    if (!isDraftPlayerOne && !isDraftPlayerTwo) {
      throw new SenderError("Only assigned players can lock powerups in this room.");
    }

    const availablePowerups = room.rolledPowers.slice(0, 3);
    if (!availablePowerups.includes(powerupId)) {
      throw new SenderError("That powerup is not part of your draft hand.");
    }

    const selectionKey = buildPowerupSelectionKey(
      normalizedRoomId,
      ctx.sender.toHexString(),
    );
    const existingLock = ctx.db.arenaPowerupLock.selectionKey.find(selectionKey);

    if (existingLock) {
      ctx.db.arenaPowerupLock.selectionKey.update({
        ...existingLock,
        powerupId,
        lockedAt: ctx.timestamp,
      });
      return;
    }

    ctx.db.arenaPowerupLock.insert({
      selectionKey,
      roomId: normalizedRoomId,
      playerIdentity: ctx.sender,
      powerupId,
      lockedAt: ctx.timestamp,
    });
  },
);

export const unlock_arena_powerup = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    const selectionKey = buildPowerupSelectionKey(
      normalizedRoomId,
      ctx.sender.toHexString(),
    );
    const existingLock = ctx.db.arenaPowerupLock.selectionKey.find(selectionKey);
    if (!existingLock) {
      return;
    }

    ctx.db.arenaPowerupLock.selectionKey.delete(selectionKey);
  },
);

export const kick_arena_member = spacetimedb.reducer(
  {
    roomId: t.string(),
    memberId: t.u64(),
  },
  (ctx, { roomId, memberId }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    if (!room.creatorIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Only the room creator can kick users.");
    }

    const member = ctx.db.arenaRoomMember.memberId.find(memberId);
    if (!member || member.roomId !== normalizedRoomId) {
      throw new SenderError("Member not found in this room.");
    }

    if (member.memberIdentity.isEqual(room.creatorIdentity)) {
      throw new SenderError("Room creator cannot be kicked.");
    }

    ctx.db.arenaRoomMember.memberId.delete(memberId);
    console.log(
      `[Arena] member kicked room_id=${normalizedRoomId} member=${member.memberName}`,
    );
  },
);
