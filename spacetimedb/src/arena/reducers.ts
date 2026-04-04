import { ScheduleAt, Timestamp } from "spacetimedb";
import {
  SenderError,
  t,
  type InferSchema,
  type ReducerCtx,
} from "spacetimedb/server";
import spacetimedb from "../schema";
import { normalizeUsernameKey } from "../auth/validation";
import {
  PLAYER_ACTIVITY,
  cancelPendingInvitesForSender,
  clearPresenceIfInRoom,
  expirePendingInviteByRoomId,
  getDisplayUsername,
  setPresenceActivity,
  upsertRivalEntry,
} from "../social/shared";
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
const TIME_KUM_ROUND_ONE_PENALTY_SECONDS = 60n;
const TIME_KUM_ROUND_TWO_PENALTY_SECONDS = 120n;
const TIME_KUM_ROUND_THREE_PENALTY_SECONDS = 180n;
const ROUND_ONE_TIME_HEIST_MICROS = 90n * 1_000_000n;
const ROUND_TWO_TIME_HEIST_MICROS = 150n * 1_000_000n;
const ROUND_THREE_TIME_HEIST_MICROS = 210n * 1_000_000n;
const TIME_HEIST_POWERUP_ID = "TimeHeistCard";
const TIME_KUM_POWERUP_ID = "TimeKumCard";
const MIRROR_SHIELD_POWERUP_ID = "MirrorShieldCard";
const NO_MISTAKES_POWERUP_ID = "NoMistakesCard";

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

function getTimeHeistMicros(roundNumber: bigint) {
  if (roundNumber === 1n) {
    return ROUND_ONE_TIME_HEIST_MICROS;
  }

  if (roundNumber === 2n) {
    return ROUND_TWO_TIME_HEIST_MICROS;
  }

  return ROUND_THREE_TIME_HEIST_MICROS;
}

function appliesPowerupAtRoundStart(powerupId: string | undefined) {
  return (
    powerupId === NO_MISTAKES_POWERUP_ID ||
    powerupId === TIME_HEIST_POWERUP_ID ||
    powerupId === TIME_KUM_POWERUP_ID ||
    powerupId === MIRROR_SHIELD_POWERUP_ID
  );
}

function hasMirrorShieldActive(powerupId: string | undefined, hasLockedPower: boolean) {
  return hasLockedPower && powerupId === MIRROR_SHIELD_POWERUP_ID;
}

function getRoundDurationSeconds(roundNumber: bigint) {
  return getRoundDurationMicros(roundNumber) / 1_000_000n;
}

function getRoundMaxPoints(roundNumber: bigint) {
  return 200n + getRoundDurationSeconds(roundNumber) / 2n;
}

function getTimeKumPenaltySeconds(roundNumber: bigint) {
  if (roundNumber === 1n) {
    return TIME_KUM_ROUND_ONE_PENALTY_SECONDS;
  }

  if (roundNumber === 2n) {
    return TIME_KUM_ROUND_TWO_PENALTY_SECONDS;
  }

  return TIME_KUM_ROUND_THREE_PENALTY_SECONDS;
}

function getEffectiveRoundDurationSeconds(
  ctx: ArenaReducerCtx,
  roomId: string,
  roundNumber: bigint,
  playerIdentity: ArenaReducerCtx["sender"],
) {
  const baseRoundDurationSeconds = getRoundDurationSeconds(roundNumber);
  const playerState = ctx.db.arenaPowerupLock.selectionKey.find(
    buildPowerupSelectionKey(roomId, playerIdentity.toHexString()),
  );
  const playerSpecificDurationSeconds =
    playerState?.playerRoundStartTime &&
    playerState?.playerRoundEndTime &&
    playerState.playerRoundStartTime.microsSinceUnixEpoch > 0n &&
    playerState.playerRoundEndTime.microsSinceUnixEpoch >
      playerState.playerRoundStartTime.microsSinceUnixEpoch
      ? (playerState.playerRoundEndTime.microsSinceUnixEpoch -
          playerState.playerRoundStartTime.microsSinceUnixEpoch) /
        1_000_000n
      : undefined;
  const opponentState = listPowerupLocks(ctx, roomId).find(
    (lock) => !lock.playerIdentity.isEqual(playerIdentity),
  );

  if (playerSpecificDurationSeconds !== undefined) {
    return playerSpecificDurationSeconds;
  }

  if (opponentState?.powerupId !== "TimeKumCard") {
    return baseRoundDurationSeconds;
  }

  const penaltySeconds = getTimeKumPenaltySeconds(roundNumber);
  return baseRoundDurationSeconds > penaltySeconds
    ? baseRoundDurationSeconds - penaltySeconds
    : 0n;
}

function calculateRoundPoints(
  roundNumber: bigint,
  submittedTimeTakenSeconds: bigint,
  submittedTestcasesPassed: bigint,
  submittedTotalTestcases: bigint,
  roundDurationSecondsOverride?: bigint,
) {
  if (submittedTotalTestcases <= 0n || submittedTestcasesPassed <= 0n) {
    return 0n;
  }

  const roundDurationSeconds =
    roundDurationSecondsOverride ?? getRoundDurationSeconds(roundNumber);
  if (roundDurationSeconds <= 0n) {
    return 0n;
  }
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

function listMatchSummaries(ctx: ArenaReducerCtx, roomId: string) {
  return [...ctx.db.arenaMatchSummary.iter()].filter(
    (summary) => summary.roomId === roomId,
  );
}

function getLeagueFromElo(eloRating: bigint) {
  if (eloRating <= 500n) {
    if (eloRating <= 200n) return "Bronze I";
    if (eloRating <= 400n) return "Bronze II";
    return "Bronze III";
  }

  if (eloRating <= 1000n) {
    if (eloRating <= 700n) return "Silver I";
    if (eloRating <= 900n) return "Silver II";
    return "Silver III";
  }

  if (eloRating <= 1500n) {
    if (eloRating <= 1200n) return "Gold I";
    if (eloRating <= 1400n) return "Gold II";
    return "Gold III";
  }

  if (eloRating <= 1700n) return "Diamond I";
  if (eloRating <= 1900n) return "Diamond II";
  return "Diamond III";
}

function calculateEloDelta(
  playerEloRating: bigint,
  opponentEloRating: bigint,
  actualScore: number,
) {
  const ratingGap = Number(opponentEloRating - playerEloRating);
  const expectedScore = 1 / (1 + 10 ** (ratingGap / 400));
  return BigInt(Math.round(32 * (actualScore - expectedScore)));
}

function buildMatchSummaryKey(roomId: string, usernameKey: string) {
  return `${roomId}:${usernameKey}`;
}

function buildMatchContinueKey(roomId: string, playerIdentityHex: string) {
  return `${roomId}:${playerIdentityHex}`;
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
      appliedAtRoundStartAt: undefined,
      playerRoundStartTime: undefined,
      playerRoundEndTime: undefined,
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
    appliedAtRoundStartAt: undefined,
    playerRoundStartTime: undefined,
    playerRoundEndTime: undefined,
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

  const timeoutJobs = listRoomTimeoutJobs(ctx, roomId);
  for (const timeoutJob of timeoutJobs) {
    ctx.db.arenaRoomTimeoutJob.scheduledId.delete(timeoutJob.scheduledId);
  }

  const matchContinueRows = [
    ...ctx.db.arenaMatchContinue.arena_match_continue_room_id.filter(roomId),
  ];
  for (const matchContinueRow of matchContinueRows) {
    ctx.db.arenaMatchContinue.continueKey.delete(matchContinueRow.continueKey);
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
    setPresenceActivity(ctx, ctx.sender, PLAYER_ACTIVITY.in_lobby, normalizedRoomId);

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

    const roomMembers = listRoomMembers(ctx, normalizedRoomId);
    expirePendingInviteByRoomId(
      ctx,
      normalizedRoomId,
      "cancelled",
      `${room.creatorName} cancelled the match invite.`,
    );
    deleteRoomAndMembers(ctx, normalizedRoomId);
    for (const member of roomMembers) {
      clearPresenceIfInRoom(ctx, member.memberIdentity, normalizedRoomId);
    }
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

    const roomMembers = listRoomMembers(ctx, room.roomId);
    expirePendingInviteByRoomId(
      ctx,
      room.roomId,
      "expired",
      `${room.creatorName} did not start the room in time.`,
    );
    deleteRoomAndMembers(ctx, room.roomId);
    for (const member of roomMembers) {
      clearPresenceIfInRoom(ctx, member.memberIdentity, room.roomId);
    }

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
    setPresenceActivity(ctx, ctx.sender, PLAYER_ACTIVITY.in_lobby, normalizedRoomId);

    console.log(
      `[Arena] member joined room_id=${normalizedRoomId} username=${session.username}`,
    );
  },
);

export const leave_arena_room = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    if (room.matchState !== "waiting") {
      throw new SenderError("You can only leave before the match starts.");
    }

    if (room.creatorIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Room creator must delete the room instead.");
    }

    const membershipKey = buildMembershipKey(
      normalizedRoomId,
      ctx.sender.toHexString(),
    );
    const membership = ctx.db.arenaRoomMember.membershipKey.find(membershipKey);
    if (!membership) {
      return;
    }

    ctx.db.arenaRoomMember.memberId.delete(membership.memberId);
    clearPresenceIfInRoom(ctx, ctx.sender, normalizedRoomId);
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
        appliedAtRoundStartAt: undefined,
        playerRoundStartTime: undefined,
        playerRoundEndTime: undefined,
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
        appliedAtRoundStartAt: undefined,
        playerRoundStartTime: undefined,
        playerRoundEndTime: undefined,
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
      appliedAtRoundStartAt: undefined,
      playerRoundStartTime: undefined,
      playerRoundEndTime: undefined,
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

    const baseRoundDurationMicros = getRoundDurationMicros(room.currentRound);
    const roundEndMicros =
      ctx.timestamp.microsSinceUnixEpoch + baseRoundDurationMicros;
    const playerOneIdentity = room.draftPlayerOneIdentity;
    const playerTwoIdentity = room.draftPlayerTwoIdentity;
    const playerOneState = playerOneIdentity
      ? ctx.db.arenaPowerupLock.selectionKey.find(
          buildPowerupSelectionKey(normalizedRoomId, playerOneIdentity.toHexString()),
        )
      : undefined;
    const playerTwoState = playerTwoIdentity
      ? ctx.db.arenaPowerupLock.selectionKey.find(
          buildPowerupSelectionKey(normalizedRoomId, playerTwoIdentity.toHexString()),
        )
      : undefined;

    let playerOneBonusMicros = 0n;
    let playerTwoBonusMicros = 0n;
    const playerOneDebuffs: string[] = [];
    const playerTwoDebuffs: string[] = [];
    const timeHeistMicros = getTimeHeistMicros(room.currentRound);
    const timeKumMicros =
      getTimeKumPenaltySeconds(room.currentRound) * 1_000_000n;
    const playerOneHasMirrorShield = hasMirrorShieldActive(
      playerOneState?.powerupId,
      playerOneState?.hasLockedPower ?? false,
    );
    const playerTwoHasMirrorShield = hasMirrorShieldActive(
      playerTwoState?.powerupId,
      playerTwoState?.hasLockedPower ?? false,
    );

    if (
      playerOneState?.hasLockedPower &&
      appliesPowerupAtRoundStart(playerOneState.powerupId) &&
      playerOneState.powerupId === TIME_HEIST_POWERUP_ID
    ) {
      if (playerTwoHasMirrorShield) {
        playerOneBonusMicros -= timeHeistMicros;
        playerTwoBonusMicros += timeHeistMicros;
      } else {
        playerOneBonusMicros += timeHeistMicros;
        playerTwoBonusMicros -= timeHeistMicros;
      }
    }

    if (
      playerTwoState?.hasLockedPower &&
      appliesPowerupAtRoundStart(playerTwoState.powerupId) &&
      playerTwoState.powerupId === TIME_HEIST_POWERUP_ID
    ) {
      if (playerOneHasMirrorShield) {
        playerTwoBonusMicros -= timeHeistMicros;
        playerOneBonusMicros += timeHeistMicros;
      } else {
        playerTwoBonusMicros += timeHeistMicros;
        playerOneBonusMicros -= timeHeistMicros;
      }
    }

    if (
      playerOneState?.hasLockedPower &&
      appliesPowerupAtRoundStart(playerOneState.powerupId) &&
      playerOneState.powerupId === TIME_KUM_POWERUP_ID
    ) {
      if (playerTwoHasMirrorShield) {
        playerOneBonusMicros -= timeKumMicros;
      } else {
        playerTwoBonusMicros -= timeKumMicros;
      }
    }

    if (
      playerTwoState?.hasLockedPower &&
      appliesPowerupAtRoundStart(playerTwoState.powerupId) &&
      playerTwoState.powerupId === TIME_KUM_POWERUP_ID
    ) {
      if (playerOneHasMirrorShield) {
        playerTwoBonusMicros -= timeKumMicros;
      } else {
        playerOneBonusMicros -= timeKumMicros;
      }
    }

    if (
      playerOneState?.hasLockedPower &&
      appliesPowerupAtRoundStart(playerOneState.powerupId) &&
      playerOneState.powerupId === NO_MISTAKES_POWERUP_ID
    ) {
      if (playerTwoHasMirrorShield) {
        playerOneDebuffs.push(NO_MISTAKES_POWERUP_ID);
      } else {
        playerTwoDebuffs.push(NO_MISTAKES_POWERUP_ID);
      }
    }

    if (
      playerTwoState?.hasLockedPower &&
      appliesPowerupAtRoundStart(playerTwoState.powerupId) &&
      playerTwoState.powerupId === NO_MISTAKES_POWERUP_ID
    ) {
      if (playerOneHasMirrorShield) {
        playerTwoDebuffs.push(NO_MISTAKES_POWERUP_ID);
      } else {
        playerOneDebuffs.push(NO_MISTAKES_POWERUP_ID);
      }
    }

    if (playerOneState) {
      ctx.db.arenaPowerupLock.selectionKey.update({
        ...playerOneState,
        activeDebuffs: playerOneDebuffs,
        appliedAtRoundStartAt:
          appliesPowerupAtRoundStart(playerOneState.powerupId) &&
          playerOneState.hasLockedPower
            ? ctx.timestamp
            : undefined,
        playerRoundStartTime: ctx.timestamp,
        playerRoundEndTime: new Timestamp(
          ctx.timestamp.microsSinceUnixEpoch +
            baseRoundDurationMicros +
            playerOneBonusMicros,
        ),
      });
    }

    if (playerTwoState) {
      ctx.db.arenaPowerupLock.selectionKey.update({
        ...playerTwoState,
        activeDebuffs: playerTwoDebuffs,
        appliedAtRoundStartAt:
          appliesPowerupAtRoundStart(playerTwoState.powerupId) &&
          playerTwoState.hasLockedPower
            ? ctx.timestamp
            : undefined,
        playerRoundStartTime: ctx.timestamp,
        playerRoundEndTime: new Timestamp(
          ctx.timestamp.microsSinceUnixEpoch +
            baseRoundDurationMicros +
            playerTwoBonusMicros,
        ),
      });
    }

    ctx.db.arenaRoom.roomId.update({
      ...room,
      matchState: "playing",
      roundStartTime: ctx.timestamp,
      roundEndTime: new Timestamp(roundEndMicros),
    });
    if (playerOneIdentity) {
      setPresenceActivity(
        ctx,
        playerOneIdentity,
        PLAYER_ACTIVITY.in_match,
        normalizedRoomId,
      );
      cancelPendingInvitesForSender(
        ctx,
        playerOneIdentity,
        "expired",
        `${getDisplayUsername(ctx, playerOneIdentity)} is already in another match.`,
      );
    }
    if (playerTwoIdentity) {
      setPresenceActivity(
        ctx,
        playerTwoIdentity,
        PLAYER_ACTIVITY.in_match,
        normalizedRoomId,
      );
      cancelPendingInvitesForSender(
        ctx,
        playerTwoIdentity,
        "expired",
        `${getDisplayUsername(ctx, playerTwoIdentity)} is already in another match.`,
      );
    }
  },
);

export const trigger_arena_sabotage = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);
    if (!room) {
      throw new SenderError("Room not found.");
    }

    if (room.matchState !== "playing") {
      throw new SenderError("Sabotage can only be triggered during a live round.");
    }

    const roomMembers = listRoomMembers(ctx, normalizedRoomId);
    const senderIsInRoom = roomMembers.some((member) =>
      member.memberIdentity.isEqual(ctx.sender),
    );
    if (!senderIsInRoom) {
      throw new SenderError("Only players in the room can trigger sabotage.");
    }

    const targetMember = roomMembers.find(
      (member) => !member.memberIdentity.isEqual(ctx.sender),
    );
    if (!targetMember) {
      throw new SenderError("A rival must be present before you can sabotage.");
    }

    const selectionKey = buildPowerupSelectionKey(
      normalizedRoomId,
      ctx.sender.toHexString(),
    );
    const playerState = ctx.db.arenaPowerupLock.selectionKey.find(selectionKey);
    if (!playerState || !playerState.hasLockedPower || !playerState.powerupId) {
      throw new SenderError("Lock a powerup before triggering sabotage.");
    }

    const targetState = ctx.db.arenaPowerupLock.selectionKey.find(
      buildPowerupSelectionKey(
        normalizedRoomId,
        targetMember.memberIdentity.toHexString(),
      ),
    );

    if (appliesPowerupAtRoundStart(playerState.powerupId)) {
      throw new SenderError("This powerup is applied automatically when the round begins.");
    }

    ctx.db.arenaSabotageEvent.insert({
      eventId: 0n,
      roomId: normalizedRoomId,
      roundNumber: room.currentRound,
      sourcePlayerIdentity: ctx.sender,
      targetPlayerIdentity:
        hasMirrorShieldActive(
          targetState?.powerupId,
          targetState?.hasLockedPower ?? false,
        )
          ? ctx.sender
          : targetMember.memberIdentity,
      powerupId: playerState.powerupId,
      createdAt: ctx.timestamp,
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

    const effectiveRoundDurationSeconds = getEffectiveRoundDurationSeconds(
      ctx,
      normalizedRoomId,
      room.currentRound,
      ctx.sender,
    );
    const elapsedRoundSeconds = room.roundStartTime
      ? (ctx.timestamp.microsSinceUnixEpoch -
          room.roundStartTime.microsSinceUnixEpoch) /
        1_000_000n
      : 0n;
    const submittedAfterDeadline =
      elapsedRoundSeconds > effectiveRoundDurationSeconds;
    const finalTimeTakenSeconds = submittedAfterDeadline
      ? effectiveRoundDurationSeconds
      : timeTakenSeconds;
    const finalTestcasesPassed = submittedAfterDeadline ? 0n : testcasesPassed;

    const calculatedPointsEarned = calculateRoundPoints(
      room.currentRound,
      finalTimeTakenSeconds,
      finalTestcasesPassed,
      totalTestcases,
      effectiveRoundDurationSeconds,
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
      timeTakenSeconds: finalTimeTakenSeconds,
      testcasesPassed: finalTestcasesPassed,
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

    const playerOneIdentity = room.draftPlayerOneIdentity;
    const playerTwoIdentity = room.draftPlayerTwoIdentity;

    if (room.currentRound >= TOTAL_ROUNDS) {
      const roomMembers = listRoomMembers(ctx, normalizedRoomId);
      const allRoundResults = listRoundResults(ctx, normalizedRoomId);
      const [playerOne, playerTwo] = roomMembers;

      if (playerOne && playerTwo) {
        const playerOneUsernameKey = normalizeUsernameKey(playerOne.memberName);
        const playerTwoUsernameKey = normalizeUsernameKey(playerTwo.memberName);
        const playerOneProfile =
          ctx.db.playerProfile.usernameKey.find(playerOneUsernameKey);
        const playerTwoProfile =
          ctx.db.playerProfile.usernameKey.find(playerTwoUsernameKey);

        if (playerOneProfile && playerTwoProfile) {
          const playerOneResults = allRoundResults.filter((result) =>
            result.playerIdentity.isEqual(playerOne.memberIdentity),
          );
          const playerTwoResults = allRoundResults.filter((result) =>
            result.playerIdentity.isEqual(playerTwo.memberIdentity),
          );

          const aggregate = (
            results: typeof playerOneResults,
          ) =>
            results.reduce(
              (accumulator, resultRow) => ({
                points: accumulator.points + resultRow.pointsEarned,
                testsPassed: accumulator.testsPassed + resultRow.testcasesPassed,
                totalTests: accumulator.totalTests + resultRow.totalTestcases,
                durationSeconds:
                  accumulator.durationSeconds + resultRow.timeTakenSeconds,
              }),
              {
                points: 0n,
                testsPassed: 0n,
                totalTests: 0n,
                durationSeconds: 0n,
              },
            );

          const playerOneAggregate = aggregate(playerOneResults);
          const playerTwoAggregate = aggregate(playerTwoResults);

          let playerOneActualScore = 0.5;
          let playerTwoActualScore = 0.5;

          if (playerOneAggregate.points > playerTwoAggregate.points) {
            playerOneActualScore = 1;
            playerTwoActualScore = 0;
          } else if (playerOneAggregate.points < playerTwoAggregate.points) {
            playerOneActualScore = 0;
            playerTwoActualScore = 1;
          } else if (playerOneAggregate.testsPassed > playerTwoAggregate.testsPassed) {
            playerOneActualScore = 1;
            playerTwoActualScore = 0;
          } else if (playerOneAggregate.testsPassed < playerTwoAggregate.testsPassed) {
            playerOneActualScore = 0;
            playerTwoActualScore = 1;
          } else if (
            playerOneAggregate.durationSeconds < playerTwoAggregate.durationSeconds
          ) {
            playerOneActualScore = 1;
            playerTwoActualScore = 0;
          } else if (
            playerOneAggregate.durationSeconds > playerTwoAggregate.durationSeconds
          ) {
            playerOneActualScore = 0;
            playerTwoActualScore = 1;
          }

          const playerOneDelta = calculateEloDelta(
            playerOneProfile.eloRating,
            playerTwoProfile.eloRating,
            playerOneActualScore,
          );
          const playerTwoDelta = calculateEloDelta(
            playerTwoProfile.eloRating,
            playerOneProfile.eloRating,
            playerTwoActualScore,
          );

          const playerOneNextElo =
            playerOneProfile.eloRating + playerOneDelta < 0n
              ? 0n
              : playerOneProfile.eloRating + playerOneDelta;
          const playerTwoNextElo =
            playerTwoProfile.eloRating + playerTwoDelta < 0n
              ? 0n
              : playerTwoProfile.eloRating + playerTwoDelta;

          ctx.db.playerProfile.usernameKey.update({
            ...playerOneProfile,
            eloRating: playerOneNextElo,
            matchesPlayed: playerOneProfile.matchesPlayed + 1n,
            wins:
              playerOneActualScore === 1
                ? playerOneProfile.wins + 1n
                : playerOneProfile.wins,
            losses:
              playerOneActualScore === 0
                ? playerOneProfile.losses + 1n
                : playerOneProfile.losses,
            updatedAt: ctx.timestamp,
          });

          ctx.db.playerProfile.usernameKey.update({
            ...playerTwoProfile,
            eloRating: playerTwoNextElo,
            matchesPlayed: playerTwoProfile.matchesPlayed + 1n,
            wins:
              playerTwoActualScore === 1
                ? playerTwoProfile.wins + 1n
                : playerTwoProfile.wins,
            losses:
              playerTwoActualScore === 0
                ? playerTwoProfile.losses + 1n
                : playerTwoProfile.losses,
            updatedAt: ctx.timestamp,
          });

          ctx.db.arenaMatchSummary.insert({
            summaryKey: buildMatchSummaryKey(normalizedRoomId, playerOneUsernameKey),
            roomId: normalizedRoomId,
            playerUsernameKey: playerOneUsernameKey,
            playerUsername: playerOne.memberName,
            opponentUsernameKey: playerTwoUsernameKey,
            opponentUsername: playerTwo.memberName,
            opponentEloBefore: playerTwoProfile.eloRating,
            opponentLeague: getLeagueFromElo(playerTwoProfile.eloRating),
            winner: playerOneActualScore === 1 ? "user" : playerOneActualScore === 0 ? "opponent" : "draw",
            pointsScored: playerOneAggregate.points,
            deltaRating: playerOneDelta,
            playerEloBefore: playerOneProfile.eloRating,
            playerEloAfter: playerOneNextElo,
            playerLeagueAfter: getLeagueFromElo(playerOneNextElo),
            createdAt: ctx.timestamp,
          });

          ctx.db.arenaMatchSummary.insert({
            summaryKey: buildMatchSummaryKey(normalizedRoomId, playerTwoUsernameKey),
            roomId: normalizedRoomId,
            playerUsernameKey: playerTwoUsernameKey,
            playerUsername: playerTwo.memberName,
            opponentUsernameKey: playerOneUsernameKey,
            opponentUsername: playerOne.memberName,
            opponentEloBefore: playerOneProfile.eloRating,
            opponentLeague: getLeagueFromElo(playerOneProfile.eloRating),
            winner: playerTwoActualScore === 1 ? "user" : playerTwoActualScore === 0 ? "opponent" : "draw",
            pointsScored: playerTwoAggregate.points,
            deltaRating: playerTwoDelta,
            playerEloBefore: playerTwoProfile.eloRating,
            playerEloAfter: playerTwoNextElo,
            playerLeagueAfter: getLeagueFromElo(playerTwoNextElo),
            createdAt: ctx.timestamp,
          });

          upsertRivalEntry(
            ctx,
            playerOne.memberIdentity,
            playerTwo.memberIdentity,
            playerTwo.memberName,
          );
          upsertRivalEntry(
            ctx,
            playerTwo.memberIdentity,
            playerOne.memberIdentity,
            playerOne.memberName,
          );
        }
      }

      ctx.db.arenaRoom.roomId.update({
        ...room,
        matchState: "finished",
        roundEndTime: ctx.timestamp,
      });
      if (playerOneIdentity) {
        clearPresenceIfInRoom(ctx, playerOneIdentity, normalizedRoomId);
      }
      if (playerTwoIdentity) {
        clearPresenceIfInRoom(ctx, playerTwoIdentity, normalizedRoomId);
      }
      deleteRoomAndMembers(ctx, normalizedRoomId);
      return;
    }

    const nextRound = room.currentRound + 1n;
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
    setPresenceActivity(ctx, playerOneIdentity, PLAYER_ACTIVITY.in_lobby, normalizedRoomId);
    setPresenceActivity(ctx, playerTwoIdentity, PLAYER_ACTIVITY.in_lobby, normalizedRoomId);
  },
);

export const continue_after_arena_match = spacetimedb.reducer(
  { roomId: t.string() },
  (ctx, { roomId }) => {
    requireSession(ctx);
    const normalizedRoomId = normalizeRoomId(roomId);
    const room = ctx.db.arenaRoom.roomId.find(normalizedRoomId);

    if (!room) {
      return;
    }

    if (room.matchState !== "finished") {
      throw new SenderError("Match results are not ready yet.");
    }

    const membershipKey = buildMembershipKey(
      normalizedRoomId,
      ctx.sender.toHexString(),
    );
    const roomMember = ctx.db.arenaRoomMember.membershipKey.find(membershipKey);
    if (!roomMember) {
      throw new SenderError("You are not a member of this room.");
    }

    const continueKey = buildMatchContinueKey(
      normalizedRoomId,
      ctx.sender.toHexString(),
    );
    if (!ctx.db.arenaMatchContinue.continueKey.find(continueKey)) {
      ctx.db.arenaMatchContinue.insert({
        continueKey,
        roomId: normalizedRoomId,
        playerIdentity: ctx.sender,
        continuedAt: ctx.timestamp,
      });
    }

    const roomMembers = listRoomMembers(ctx, normalizedRoomId);
    const continueRows = [
      ...ctx.db.arenaMatchContinue.arena_match_continue_room_id.filter(
        normalizedRoomId,
      ),
    ];

    if (continueRows.length < roomMembers.length) {
      return;
    }

    deleteRoomAndMembers(ctx, normalizedRoomId);
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
    clearPresenceIfInRoom(ctx, member.memberIdentity, normalizedRoomId);
    console.log(
      `[Arena] member kicked room_id=${normalizedRoomId} member=${member.memberName}`,
    );
  },
);
