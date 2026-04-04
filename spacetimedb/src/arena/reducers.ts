import { ScheduleAt, Timestamp } from "spacetimedb";
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
const TOTAL_ROUNDS = 3n;
const ROUND_ONE_DURATION_MICROS = 5n * 60n * 1_000_000n;
const ROUND_TWO_DURATION_MICROS = 10n * 60n * 1_000_000n;
const ROUND_THREE_DURATION_MICROS = 15n * 60n * 1_000_000n;

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
  roundNumber: bigint,
  timestampMicros: bigint,
) {
  const seedMaterial = `${roomId}:${playerOneIdentityHex}:${playerTwoIdentityHex}:${roundNumber.toString()}:${timestampMicros.toString()}`;
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

function getRoundDurationMicros(roundNumber: bigint) {
  if (roundNumber === 1n) {
    return ROUND_ONE_DURATION_MICROS;
  }

  if (roundNumber === 2n) {
    return ROUND_TWO_DURATION_MICROS;
  }

  return ROUND_THREE_DURATION_MICROS;
}

function getRoundDurationSeconds(roundNumber: bigint) {
  return getRoundDurationMicros(roundNumber) / 1_000_000n;
}

function getRoundMaxPoints(roundNumber: bigint) {
  return 200n + getRoundDurationSeconds(roundNumber) / 2n;
}

function calculateRoundPoints(
  roundNumber: bigint,
  submittedTimeTakenSeconds: bigint,
  submittedTestcasesPassed: bigint,
  submittedTotalTestcases: bigint,
) {
  if (submittedTotalTestcases <= 0n || submittedTestcasesPassed <= 0n) {
    return 0n;
  }

  const roundDurationSeconds = getRoundDurationSeconds(roundNumber);
  const clampedTimeTakenSeconds =
    submittedTimeTakenSeconds < 0n
      ? 0n
      : submittedTimeTakenSeconds > roundDurationSeconds
        ? roundDurationSeconds
        : submittedTimeTakenSeconds;
  const clampedTestcasesPassed =
    submittedTestcasesPassed > submittedTotalTestcases
      ? submittedTotalTestcases
      : submittedTestcasesPassed;

  const maxPoints = getRoundMaxPoints(roundNumber);
  const accuracyPool = (maxPoints * 70n) / 100n;
  const speedPool = maxPoints - accuracyPool;
  const secondsRemaining = roundDurationSeconds - clampedTimeTakenSeconds;

  const accuracyPoints =
    (accuracyPool * clampedTestcasesPassed) / submittedTotalTestcases;
  const speedPoints =
    (speedPool * clampedTestcasesPassed * secondsRemaining) /
    (submittedTotalTestcases * roundDurationSeconds);

  return accuracyPoints + speedPoints;
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

function buildRoundResultKey(
  roomId: string,
  playerIdentityHex: string,
  roundNumber: bigint,
) {
  return `${roomId}:${playerIdentityHex}:${roundNumber.toString()}`;
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

function listRoundResults(ctx: ArenaReducerCtx, roomId: string) {
  return [...ctx.db.arenaRoundResult.arena_round_result_room_id.filter(roomId)];
}

function upsertPlayerRoundState(
  ctx: ArenaReducerCtx,
  roomId: string,
  playerIdentity: ArenaReducerCtx["sender"],
) {
  const selectionKey = buildPowerupSelectionKey(roomId, playerIdentity.toHexString());
  const existingState = ctx.db.arenaPowerupLock.selectionKey.find(selectionKey);
  if (existingState) {
    ctx.db.arenaPowerupLock.selectionKey.update({
      ...existingState,
      powerupId: undefined,
      isReady: false,
      hasLockedPower: false,
      activeDebuffs: [],
      hasSubmitted: false,
      isTyping: false,
      lockedAt: undefined,
    });
    return;
  }

  ctx.db.arenaPowerupLock.insert({
    selectionKey,
    roomId,
    playerIdentity,
    powerupId: undefined,
    isReady: false,
    hasLockedPower: false,
    activeDebuffs: [],
    hasSubmitted: false,
    isTyping: false,
    lockedAt: undefined,
  });
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

  const roundResults = listRoundResults(ctx, roomId);
  for (const roundResult of roundResults) {
    ctx.db.arenaRoundResult.resultKey.delete(roundResult.resultKey);
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

    if (room.matchState !== "waiting") {
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

    if (room.matchState !== "waiting") {
      throw new SenderError("This match has already started.");
    }

    const rolledPowers = buildRolledPowers(
      room.roomId,
      playerOne.memberIdentity.toHexString(),
      playerTwo.memberIdentity.toHexString(),
      1n,
      ctx.timestamp.microsSinceUnixEpoch,
    );

    upsertPlayerRoundState(ctx, normalizedRoomId, playerOne.memberIdentity);
    upsertPlayerRoundState(ctx, normalizedRoomId, playerTwo.memberIdentity);

    ctx.db.arenaRoom.roomId.update({
      ...room,
      matchState: "drafting",
      currentRound: 1n,
      currentQuestionId: "round-1",
      draftPlayerOneIdentity: playerOne.memberIdentity,
      draftPlayerTwoIdentity: playerTwo.memberIdentity,
      rolledPowers,
      roundStartTime: undefined,
      roundEndTime: undefined,
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

    if (room.matchState !== "drafting") {
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
        isReady: false,
        hasLockedPower: true,
        hasSubmitted: false,
        lockedAt: ctx.timestamp,
      });
    } else {
      ctx.db.arenaPowerupLock.insert({
        selectionKey,
        roomId: normalizedRoomId,
        playerIdentity: ctx.sender,
        powerupId,
        isReady: false,
        hasLockedPower: true,
        activeDebuffs: [],
        hasSubmitted: false,
        isTyping: false,
        lockedAt: ctx.timestamp,
      });
    }

    const roomLocks = listPowerupLocks(ctx, normalizedRoomId).filter(
      (lock) => lock.hasLockedPower,
    );
    if (roomLocks.length >= 2) {
      ctx.db.arenaRoom.roomId.update({
        ...room,
        matchState: "round_intro",
        roundStartTime: ctx.timestamp,
        roundEndTime: undefined,
      });
    }
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

    ctx.db.arenaPowerupLock.selectionKey.update({
      ...existingLock,
      powerupId: undefined,
      isReady: false,
      hasLockedPower: false,
      lockedAt: undefined,
    });
  },
);

export const begin_playing_round = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    if (room.matchState !== "round_intro") {
      return;
    }

    const roundEndMicros =
      ctx.timestamp.microsSinceUnixEpoch + getRoundDurationMicros(room.currentRound);

    ctx.db.arenaRoom.roomId.update({
      ...room,
      matchState: "playing",
      roundStartTime: ctx.timestamp,
      roundEndTime: new Timestamp(roundEndMicros),
    });
  },
);

export const submit_round_result = spacetimedb.reducer(
  {
    roomId: t.string(),
    timeTakenSeconds: t.u64(),
    testcasesPassed: t.u64(),
    totalTestcases: t.u64(),
    pointsEarned: t.u64(),
  },
  (ctx, { roomId, timeTakenSeconds, testcasesPassed, totalTestcases, pointsEarned: _pointsEarned }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    if (room.matchState !== "playing") {
      throw new SenderError("Round results can only be submitted while playing.");
    }

    const selectionKey = buildPowerupSelectionKey(normalizedRoomId, ctx.sender.toHexString());
    const playerState = ctx.db.arenaPowerupLock.selectionKey.find(selectionKey);
    if (!playerState || !playerState.hasLockedPower || !playerState.powerupId) {
      throw new SenderError("Lock a powerup before submitting a round result.");
    }

    if (playerState.hasSubmitted) {
      return;
    }

    const calculatedPointsEarned = calculateRoundPoints(
      room.currentRound,
      timeTakenSeconds,
      testcasesPassed,
      totalTestcases,
    );

    ctx.db.arenaRoundResult.insert({
      resultKey: buildRoundResultKey(
        normalizedRoomId,
        ctx.sender.toHexString(),
        room.currentRound,
      ),
      roomId: normalizedRoomId,
      playerIdentity: ctx.sender,
      roundNumber: room.currentRound,
      powerUsed: playerState.powerupId,
      timeTakenSeconds,
      testcasesPassed,
      totalTestcases,
      pointsEarned: calculatedPointsEarned,
      createdAt: ctx.timestamp,
    });

    ctx.db.arenaPowerupLock.selectionKey.update({
      ...playerState,
      hasSubmitted: true,
      isTyping: false,
    });

    const updatedStates = listPowerupLocks(ctx, normalizedRoomId);
    const submittedStates = updatedStates.filter((state) => state.hasSubmitted);
    if (submittedStates.length < 2) {
      return;
    }

    if (room.currentRound >= TOTAL_ROUNDS) {
      ctx.db.arenaRoom.roomId.update({
        ...room,
        matchState: "finished",
        roundEndTime: ctx.timestamp,
      });
      return;
    }

    const nextRound = room.currentRound + 1n;
    const playerOneIdentity = room.draftPlayerOneIdentity;
    const playerTwoIdentity = room.draftPlayerTwoIdentity;
    if (!playerOneIdentity || !playerTwoIdentity) {
      throw new SenderError("Both players must be assigned before advancing rounds.");
    }

    const rolledPowers = buildRolledPowers(
      room.roomId,
      playerOneIdentity.toHexString(),
      playerTwoIdentity.toHexString(),
      nextRound,
      ctx.timestamp.microsSinceUnixEpoch,
    );

    upsertPlayerRoundState(ctx, normalizedRoomId, playerOneIdentity);
    upsertPlayerRoundState(ctx, normalizedRoomId, playerTwoIdentity);

    ctx.db.arenaRoom.roomId.update({
      ...room,
      matchState: "drafting",
      currentRound: nextRound,
      currentQuestionId: `round-${nextRound.toString()}`,
      rolledPowers,
      roundStartTime: undefined,
      roundEndTime: undefined,
    });
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
