import { SenderError, t, type InferSchema, type ReducerCtx } from "spacetimedb/server";
import spacetimedb from "../schema";
import { normalizeUsernameKey } from "../auth/validation";
import { buildMembershipKey, createWaitingArenaRoom, generateInviteRoomId } from "../arena/shared";
import {
  FRIEND_REQUEST_STATUS,
  GAME_INVITE_STATUS,
  NOTIFICATION_TYPE,
  PLAYER_ACTIVITY,
  areFriends,
  buildFriendshipKey,
  buildInviteId,
  buildRequestId,
  cancelPendingInvitesForSender,
  cleanupInviteRoom,
  getDisplayUsername,
  markNotificationsReadByFriendRequest,
  markNotificationsReadByInvite,
  pushNotification,
  removeRivalPair,
  setPresenceActivity,
} from "./shared";

type SocialReducerCtx = ReducerCtx<InferSchema<typeof spacetimedb>>;

function requireSession(ctx: SocialReducerCtx) {
  const session = ctx.db.authSession.sessionIdentity.find(ctx.sender);
  if (!session) {
    throw new SenderError("Log in before using social features.");
  }
  return session;
}

function ensureNoPendingFriendRequest(ctx: SocialReducerCtx, leftIdentity: SocialReducerCtx["sender"], rightIdentity: SocialReducerCtx["sender"]) {
  const outgoing = [...ctx.db.friendRequest.friend_request_from_identity.filter(leftIdentity)].find(
    (request) => request.toIdentity.isEqual(rightIdentity) && request.status === FRIEND_REQUEST_STATUS.pending,
  );
  const incoming = [...ctx.db.friendRequest.friend_request_to_identity.filter(leftIdentity)].find(
    (request) => request.fromIdentity.isEqual(rightIdentity) && request.status === FRIEND_REQUEST_STATUS.pending,
  );

  if (outgoing || incoming) {
    throw new SenderError("There is already a pending friend request between you two.");
  }
}

function ensureNoPendingInviteForIdentity(ctx: SocialReducerCtx, identity: SocialReducerCtx["sender"]) {
  const outgoing = [...ctx.db.gameInvite.game_invite_from_identity.filter(identity)].find(
    (invite) => invite.status === GAME_INVITE_STATUS.pending,
  );
  if (outgoing) {
    throw new SenderError("Finish or cancel your pending invite before creating another one.");
  }

  const incoming = [...ctx.db.gameInvite.game_invite_to_identity.filter(identity)].find(
    (invite) => invite.status === GAME_INVITE_STATUS.pending,
  );
  if (incoming) {
    throw new SenderError("That player already has a pending invite.");
  }
}

function getEffectivePresenceActivity(
  ctx: SocialReducerCtx,
  presence: ReturnType<typeof ctx.db.playerPresence.playerIdentity.find>,
) {
  if (!presence) {
    return undefined;
  }

  if (
    presence.activity === PLAYER_ACTIVITY.in_lobby &&
    presence.currentRoomId &&
    !ctx.db.arenaRoom.roomId.find(presence.currentRoomId)
  ) {
    ctx.db.playerPresence.playerIdentity.update({
      ...presence,
      activity: PLAYER_ACTIVITY.idle,
      currentRoomId: undefined,
      lastSeenAt: ctx.timestamp,
    });
    return PLAYER_ACTIVITY.idle;
  }

  return presence.activity;
}

export const send_friend_request = spacetimedb.reducer(
  { username: t.string() },
  (ctx, { username }) => {
    const session = requireSession(ctx);
    const account = ctx.db.authAccount.usernameKey.find(normalizeUsernameKey(username));
    if (!account) {
      throw new SenderError("That user was not found.");
    }

    const recipientSession = [...ctx.db.authSession.iter()].find(
      (row) => row.username.toLowerCase() === account.username.toLowerCase(),
    );
    if (!recipientSession) {
      throw new SenderError("That user has not logged in yet.");
    }

    if (recipientSession.sessionIdentity.isEqual(ctx.sender)) {
      throw new SenderError("You cannot add yourself as a friend.");
    }

    if (areFriends(ctx, ctx.sender, recipientSession.sessionIdentity)) {
      throw new SenderError("You are already friends.");
    }

    ensureNoPendingFriendRequest(ctx, ctx.sender, recipientSession.sessionIdentity);

    const requestId = buildRequestId(ctx, ctx.sender, recipientSession.sessionIdentity);
    ctx.db.friendRequest.insert({
      requestId,
      fromIdentity: ctx.sender,
      toIdentity: recipientSession.sessionIdentity,
      status: FRIEND_REQUEST_STATUS.pending,
      createdAt: ctx.timestamp,
      respondedAt: undefined,
    });

    pushNotification(
      ctx,
      recipientSession.sessionIdentity,
      NOTIFICATION_TYPE.friend_request,
      `${session.username} sent you a friend request.`,
      {
        actorIdentity: ctx.sender,
        friendRequestId: requestId,
      },
    );
  },
);

export const accept_friend_request = spacetimedb.reducer(
  { requestId: t.string() },
  (ctx, { requestId }) => {
    const session = requireSession(ctx);
    const request = ctx.db.friendRequest.requestId.find(requestId);
    if (!request || !request.toIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Friend request not found.");
    }

    if (request.status !== FRIEND_REQUEST_STATUS.pending) {
      return;
    }

    ctx.db.friendRequest.requestId.update({
      ...request,
      status: FRIEND_REQUEST_STATUS.accepted,
      respondedAt: ctx.timestamp,
    });

    const friendshipKey = buildFriendshipKey(request.fromIdentity, request.toIdentity);
    if (!ctx.db.friendship.friendshipKey.find(friendshipKey)) {
      const fromHex = request.fromIdentity.toHexString();
      const toHex = request.toIdentity.toHexString();
      ctx.db.friendship.insert({
        friendshipKey,
        userA: fromHex < toHex ? request.fromIdentity : request.toIdentity,
        userB: fromHex < toHex ? request.toIdentity : request.fromIdentity,
        createdAt: ctx.timestamp,
      });
    }

    removeRivalPair(ctx, request.fromIdentity, request.toIdentity);

    markNotificationsReadByFriendRequest(ctx, ctx.sender, requestId);

    pushNotification(
      ctx,
      request.fromIdentity,
      NOTIFICATION_TYPE.friend_accept,
      `${session.username} accepted your friend request.`,
      {
        actorIdentity: ctx.sender,
        friendRequestId: requestId,
      },
    );
  },
);

export const decline_friend_request = spacetimedb.reducer(
  { requestId: t.string() },
  (ctx, { requestId }) => {
    requireSession(ctx);
    const request = ctx.db.friendRequest.requestId.find(requestId);
    if (!request || !request.toIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Friend request not found.");
    }

    if (request.status !== FRIEND_REQUEST_STATUS.pending) {
      return;
    }

    ctx.db.friendRequest.requestId.update({
      ...request,
      status: FRIEND_REQUEST_STATUS.declined,
      respondedAt: ctx.timestamp,
    });
    markNotificationsReadByFriendRequest(ctx, ctx.sender, requestId);
  },
);

export const cancel_friend_request = spacetimedb.reducer(
  { requestId: t.string() },
  (ctx, { requestId }) => {
    requireSession(ctx);
    const request = ctx.db.friendRequest.requestId.find(requestId);
    if (!request || !request.fromIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Friend request not found.");
    }

    if (request.status !== FRIEND_REQUEST_STATUS.pending) {
      return;
    }

    ctx.db.friendRequest.requestId.update({
      ...request,
      status: FRIEND_REQUEST_STATUS.cancelled,
      respondedAt: ctx.timestamp,
    });
  },
);

export const remove_friend = spacetimedb.reducer(
  { friendIdentity: t.identity() },
  (ctx, { friendIdentity }) => {
    requireSession(ctx);
    const friendshipKey = buildFriendshipKey(ctx.sender, friendIdentity);
    if (!ctx.db.friendship.friendshipKey.find(friendshipKey)) {
      throw new SenderError("That user is not in your friends list.");
    }

    ctx.db.friendship.friendshipKey.delete(friendshipKey);
  },
);

export const send_game_invite = spacetimedb.reducer(
  { friendIdentity: t.identity() },
  (ctx, { friendIdentity }) => {
    const session = requireSession(ctx);
    if (friendIdentity.isEqual(ctx.sender)) {
      throw new SenderError("You cannot challenge yourself.");
    }

    if (!areFriends(ctx, ctx.sender, friendIdentity)) {
      throw new SenderError("You can only challenge friends.");
    }

    const senderPresence = ctx.db.playerPresence.playerIdentity.find(ctx.sender);
    const receiverPresence = ctx.db.playerPresence.playerIdentity.find(friendIdentity);
    const senderActivity = getEffectivePresenceActivity(ctx, senderPresence);
    const receiverActivity = getEffectivePresenceActivity(ctx, receiverPresence);
    if (!receiverPresence || !receiverPresence.connected) {
      throw new SenderError("That friend is offline right now.");
    }

    if (senderActivity === PLAYER_ACTIVITY.in_match) {
      throw new SenderError("Finish your current match before sending an invite.");
    }

    if (receiverActivity === PLAYER_ACTIVITY.in_match) {
      throw new SenderError("That friend is busy right now.");
    }

    ensureNoPendingInviteForIdentity(ctx, ctx.sender);
    ensureNoPendingInviteForIdentity(ctx, friendIdentity);

    const inviteId = buildInviteId(ctx, ctx.sender, friendIdentity);
    ctx.db.gameInvite.insert({
      inviteId,
      fromIdentity: ctx.sender,
      toIdentity: friendIdentity,
      roomId: undefined,
      status: GAME_INVITE_STATUS.pending,
      createdAt: ctx.timestamp,
      respondedAt: undefined,
    });

    pushNotification(
      ctx,
      friendIdentity,
      NOTIFICATION_TYPE.game_invite,
      `${session.username} challenged you to a match.`,
      {
        actorIdentity: ctx.sender,
        inviteId,
      },
    );
  },
);

export const accept_game_invite = spacetimedb.reducer(
  { inviteId: t.string() },
  (ctx, { inviteId }) => {
    const session = requireSession(ctx);
    const invite = ctx.db.gameInvite.inviteId.find(inviteId);
    if (!invite || !invite.toIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Game invite not found.");
    }

    if (invite.status !== GAME_INVITE_STATUS.pending) {
      return;
    }

    const challengerPresence = ctx.db.playerPresence.playerIdentity.find(invite.fromIdentity);
    if (!challengerPresence || !challengerPresence.connected || challengerPresence.activity === PLAYER_ACTIVITY.in_match) {
      ctx.db.gameInvite.inviteId.update({
        ...invite,
        status: GAME_INVITE_STATUS.expired,
        respondedAt: ctx.timestamp,
      });
      throw new SenderError("The challenger is no longer available.");
    }

    const receiverPresence = ctx.db.playerPresence.playerIdentity.find(ctx.sender);
    if (receiverPresence?.activity === PLAYER_ACTIVITY.in_match) {
      throw new SenderError("Finish your current match before accepting an invite.");
    }

    const challengerSession = ctx.db.authSession.sessionIdentity.find(invite.fromIdentity);
    if (!challengerSession) {
      ctx.db.gameInvite.inviteId.update({
        ...invite,
        status: GAME_INVITE_STATUS.expired,
        respondedAt: ctx.timestamp,
      });
      throw new SenderError("The challenger is no longer available.");
    }

    const roomId = generateInviteRoomId(
      ctx,
      invite.fromIdentity.toHexString(),
      ctx.sender.toHexString(),
    );
    createWaitingArenaRoom(ctx, roomId, invite.fromIdentity, challengerSession.username);

    const membershipKey = buildMembershipKey(roomId, ctx.sender.toHexString());
    if (!ctx.db.arenaRoomMember.membershipKey.find(membershipKey)) {
      ctx.db.arenaRoomMember.insert({
        memberId: 0n,
        roomId,
        memberIdentity: ctx.sender,
        memberName: session.username,
        membershipKey,
        joinedAt: ctx.timestamp,
      });
    }

    ctx.db.gameInvite.inviteId.update({
      ...invite,
      roomId,
      status: GAME_INVITE_STATUS.accepted,
      respondedAt: ctx.timestamp,
    });

    setPresenceActivity(ctx, invite.fromIdentity, PLAYER_ACTIVITY.in_lobby, roomId);
    setPresenceActivity(ctx, ctx.sender, PLAYER_ACTIVITY.in_lobby, roomId);
    markNotificationsReadByInvite(ctx, ctx.sender, inviteId);

    pushNotification(
      ctx,
      invite.fromIdentity,
      NOTIFICATION_TYPE.invite_accepted,
      `${session.username} accepted your match invite.`,
      {
        actorIdentity: ctx.sender,
        roomId,
        inviteId,
      },
    );
  },
);

export const decline_game_invite = spacetimedb.reducer(
  { inviteId: t.string() },
  (ctx, { inviteId }) => {
    const session = requireSession(ctx);
    const invite = ctx.db.gameInvite.inviteId.find(inviteId);
    if (!invite || !invite.toIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Game invite not found.");
    }

    if (invite.status !== GAME_INVITE_STATUS.pending) {
      return;
    }

    ctx.db.gameInvite.inviteId.update({
      ...invite,
      status: GAME_INVITE_STATUS.declined,
      respondedAt: ctx.timestamp,
    });

    if (invite.roomId) {
      const room = ctx.db.arenaRoom.roomId.find(invite.roomId);
      if (room) {
        cleanupInviteRoom(ctx, invite.roomId);
      }
    }

    markNotificationsReadByInvite(ctx, ctx.sender, inviteId);
    pushNotification(
      ctx,
      invite.fromIdentity,
      NOTIFICATION_TYPE.invite_declined,
      `${session.username} declined your match invite.`,
      {
        actorIdentity: ctx.sender,
        roomId: invite.roomId,
        inviteId,
      },
    );
  },
);

export const cancel_game_invite = spacetimedb.reducer(
  { inviteId: t.string() },
  (ctx, { inviteId }) => {
    requireSession(ctx);
    const invite = ctx.db.gameInvite.inviteId.find(inviteId);
    if (!invite || !invite.fromIdentity.isEqual(ctx.sender)) {
      throw new SenderError("Game invite not found.");
    }

    if (invite.status !== GAME_INVITE_STATUS.pending) {
      return;
    }

    ctx.db.gameInvite.inviteId.update({
      ...invite,
      status: GAME_INVITE_STATUS.cancelled,
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
      NOTIFICATION_TYPE.invite_cancelled,
      `${getDisplayUsername(ctx, ctx.sender)} cancelled the match invite.`,
      {
        actorIdentity: ctx.sender,
        roomId: invite.roomId,
        inviteId,
      },
    );
  },
);

export const mark_notification_read = spacetimedb.reducer(
  { notificationId: t.string() },
  (ctx, { notificationId }) => {
    requireSession(ctx);
    const notification = ctx.db.userNotification.notificationId.find(notificationId);
    if (!notification || !notification.recipientIdentity.isEqual(ctx.sender) || notification.isRead) {
      return;
    }

    ctx.db.userNotification.notificationId.update({
      ...notification,
      isRead: true,
      readAt: ctx.timestamp,
    });
  },
);

export const set_player_activity = spacetimedb.reducer(
  {
    activity: t.string(),
    roomId: t.string().optional(),
  },
  (ctx, { activity, roomId }) => {
    const session = requireSession(ctx);
    setPresenceActivity(ctx, ctx.sender, activity, roomId);

    if (activity === PLAYER_ACTIVITY.in_match) {
      cancelPendingInvitesForSender(
        ctx,
        ctx.sender,
        "expired",
        `${session.username} is no longer available for that invite.`,
      );
    }
  },
);
