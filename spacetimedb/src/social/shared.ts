import type { Identity } from "spacetimedb";
import { type InferSchema, type ReducerCtx } from "spacetimedb/server";
import spacetimedb from "../schema";
import { deleteArenaRoomState, listRoomMembers } from "../arena/shared";

type SharedReducerCtx = ReducerCtx<InferSchema<typeof spacetimedb>>;

export const PLAYER_ACTIVITY = {
  offline: "offline",
  idle: "idle",
  in_lobby: "in_lobby",
  in_match: "in_match",
} as const;

export const FRIEND_REQUEST_STATUS = {
  pending: "pending",
  accepted: "accepted",
  declined: "declined",
  cancelled: "cancelled",
} as const;

export const GAME_INVITE_STATUS = {
  pending: "pending",
  accepted: "accepted",
  declined: "declined",
  expired: "expired",
  cancelled: "cancelled",
} as const;

export const NOTIFICATION_TYPE = {
  friend_request: "friend_request",
  friend_accept: "friend_accept",
  game_invite: "game_invite",
  invite_accepted: "invite_accepted",
  invite_declined: "invite_declined",
  invite_expired: "invite_expired",
  invite_cancelled: "invite_cancelled",
} as const;

function hashToUint32(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function buildFriendshipKey(leftIdentity: Identity, rightIdentity: Identity) {
  const leftHex = leftIdentity.toHexString();
  const rightHex = rightIdentity.toHexString();
  return leftHex < rightHex ? `${leftHex}:${rightHex}` : `${rightHex}:${leftHex}`;
}

export function buildRequestId(ctx: SharedReducerCtx, fromIdentity: Identity, toIdentity: Identity) {
  return `fr_${hashToUint32(`${fromIdentity.toHexString()}:${toIdentity.toHexString()}:${ctx.timestamp.microsSinceUnixEpoch.toString()}`).toString(16)}`;
}

export function buildInviteId(ctx: SharedReducerCtx, fromIdentity: Identity, toIdentity: Identity) {
  return `gi_${hashToUint32(`${fromIdentity.toHexString()}:${toIdentity.toHexString()}:${ctx.timestamp.microsSinceUnixEpoch.toString()}`).toString(16)}`;
}

export function buildNotificationId(
  ctx: SharedReducerCtx,
  recipientIdentity: Identity,
  notificationType: string,
) {
  return `nt_${hashToUint32(`${recipientIdentity.toHexString()}:${notificationType}:${ctx.timestamp.microsSinceUnixEpoch.toString()}`).toString(16)}`;
}

export function getDisplayUsername(ctx: SharedReducerCtx, identity: Identity) {
  const presence = ctx.db.playerPresence.playerIdentity.find(identity);
  if (presence) {
    return presence.username;
  }

  const session = ctx.db.authSession.sessionIdentity.find(identity);
  return session?.username ?? identity.toHexString().slice(0, 8);
}

export function upsertPresence(
  ctx: SharedReducerCtx,
  identity: Identity,
  username: string,
  connected: boolean,
  activity: string,
  currentRoomId?: string,
) {
  const existingPresence = ctx.db.playerPresence.playerIdentity.find(identity);
  const nextActivity = connected ? activity : PLAYER_ACTIVITY.offline;
  const nextRoomId = connected ? currentRoomId : undefined;

  if (existingPresence) {
    ctx.db.playerPresence.playerIdentity.update({
      ...existingPresence,
      username,
      connected,
      activity: nextActivity,
      currentRoomId: nextRoomId,
      lastSeenAt: ctx.timestamp,
    });
    return;
  }

  ctx.db.playerPresence.insert({
    playerIdentity: identity,
    username,
    connected,
    activity: nextActivity,
    currentRoomId: nextRoomId,
    lastSeenAt: ctx.timestamp,
  });
}

export function setPresenceActivity(
  ctx: SharedReducerCtx,
  identity: Identity,
  activity: string,
  currentRoomId?: string,
) {
  const existingPresence = ctx.db.playerPresence.playerIdentity.find(identity);
  if (!existingPresence) {
    upsertPresence(ctx, identity, getDisplayUsername(ctx, identity), true, activity, currentRoomId);
    return;
  }

  ctx.db.playerPresence.playerIdentity.update({
    ...existingPresence,
    connected: true,
    activity,
    currentRoomId,
    lastSeenAt: ctx.timestamp,
  });
}

export function clearPresenceIfInRoom(
  ctx: SharedReducerCtx,
  identity: Identity,
  roomId: string,
) {
  const presence = ctx.db.playerPresence.playerIdentity.find(identity);
  if (!presence || presence.currentRoomId !== roomId) {
    return;
  }

  ctx.db.playerPresence.playerIdentity.update({
    ...presence,
    activity: presence.connected ? PLAYER_ACTIVITY.idle : PLAYER_ACTIVITY.offline,
    currentRoomId: undefined,
    lastSeenAt: ctx.timestamp,
  });
}

export function pushNotification(
  ctx: SharedReducerCtx,
  recipientIdentity: Identity,
  notificationType: string,
  message: string,
  options?: {
    actorIdentity?: Identity;
    roomId?: string;
    inviteId?: string;
    friendRequestId?: string;
  },
) {
  ctx.db.userNotification.insert({
    notificationId: buildNotificationId(ctx, recipientIdentity, notificationType),
    recipientIdentity,
    notificationType,
    actorIdentity: options?.actorIdentity,
    roomId: options?.roomId,
    inviteId: options?.inviteId,
    friendRequestId: options?.friendRequestId,
    message,
    isRead: false,
    createdAt: ctx.timestamp,
    readAt: undefined,
  });
}

export function markNotificationsReadByInvite(
  ctx: SharedReducerCtx,
  recipientIdentity: Identity,
  inviteId: string,
) {
  for (const notification of ctx.db.userNotification.user_notification_invite_id.filter(inviteId)) {
    if (!notification.recipientIdentity.isEqual(recipientIdentity) || notification.isRead) {
      continue;
    }

    ctx.db.userNotification.notificationId.update({
      ...notification,
      isRead: true,
      readAt: ctx.timestamp,
    });
  }
}

export function markNotificationsReadByFriendRequest(
  ctx: SharedReducerCtx,
  recipientIdentity: Identity,
  friendRequestId: string,
) {
  for (const notification of ctx.db.userNotification.user_notification_friend_request_id.filter(friendRequestId)) {
    if (!notification.recipientIdentity.isEqual(recipientIdentity) || notification.isRead) {
      continue;
    }

    ctx.db.userNotification.notificationId.update({
      ...notification,
      isRead: true,
      readAt: ctx.timestamp,
    });
  }
}

export function areFriends(ctx: SharedReducerCtx, leftIdentity: Identity, rightIdentity: Identity) {
  return Boolean(ctx.db.friendship.friendshipKey.find(buildFriendshipKey(leftIdentity, rightIdentity)));
}

export function cleanupInviteRoom(
  ctx: SharedReducerCtx,
  roomId: string,
) {
  const roomMembers = listRoomMembers(ctx, roomId);
  deleteArenaRoomState(ctx, roomId);
  for (const member of roomMembers) {
    clearPresenceIfInRoom(ctx, member.memberIdentity, roomId);
  }
}

export function expirePendingInviteByRoomId(
  ctx: SharedReducerCtx,
  roomId: string,
  nextStatus: string,
  messageForRecipient: string,
) {
  const invites = [...ctx.db.gameInvite.game_invite_room_id.filter(roomId)].filter(
    (invite) => invite.status === GAME_INVITE_STATUS.pending,
  );

  for (const invite of invites) {
    ctx.db.gameInvite.inviteId.update({
      ...invite,
      status: nextStatus,
      respondedAt: ctx.timestamp,
    });
    pushNotification(
      ctx,
      invite.toIdentity,
      nextStatus === GAME_INVITE_STATUS.expired
        ? NOTIFICATION_TYPE.invite_expired
        : NOTIFICATION_TYPE.invite_cancelled,
      messageForRecipient,
      {
        actorIdentity: invite.fromIdentity,
        roomId,
        inviteId: invite.inviteId,
      },
    );
  }
}

export function cancelPendingInvitesForSender(
  ctx: SharedReducerCtx,
  senderIdentity: Identity,
  reason: "expired" | "cancelled",
  messageForRecipient: string,
) {
  const pendingInvites = [...ctx.db.gameInvite.game_invite_from_identity.filter(senderIdentity)].filter(
    (invite) => invite.status === GAME_INVITE_STATUS.pending,
  );

  for (const invite of pendingInvites) {
    ctx.db.gameInvite.inviteId.update({
      ...invite,
      status: reason === "expired" ? GAME_INVITE_STATUS.expired : GAME_INVITE_STATUS.cancelled,
      respondedAt: ctx.timestamp,
    });

    if (invite.roomId) {
      const room = ctx.db.arenaRoom.roomId.find(invite.roomId);
      if (room) {
        cleanupInviteRoom(ctx, invite.roomId);
      }
    }

    pushNotification(
      ctx,
      invite.toIdentity,
      reason === "expired"
        ? NOTIFICATION_TYPE.invite_expired
        : NOTIFICATION_TYPE.invite_cancelled,
      messageForRecipient,
      {
        actorIdentity: invite.fromIdentity,
        roomId: invite.roomId,
        inviteId: invite.inviteId,
      },
    );
  }
}
