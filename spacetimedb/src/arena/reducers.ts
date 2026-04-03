import {
  SenderError,
  t,
  type InferSchema,
  type ReducerCtx,
} from "spacetimedb/server";
import spacetimedb from "../schema";

type ArenaReducerCtx = ReducerCtx<InferSchema<typeof spacetimedb>>;

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

function listRoomMembers(ctx: ArenaReducerCtx, roomId: string) {
  return [...ctx.db.arenaRoomMember.iter()].filter(
    (member) => member.roomId === roomId,
  );
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
      createdAt: ctx.timestamp,
      startedAt: undefined,
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

    if (room.matchState === "started") {
      return;
    }

    ctx.db.arenaRoom.roomId.update({
      ...room,
      matchState: "started",
      startedAt: ctx.timestamp,
    });

    console.log(`[Arena] match started room_id=${normalizedRoomId}`);
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
