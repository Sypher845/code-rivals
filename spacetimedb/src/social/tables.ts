import { t, table } from "spacetimedb/server";

export const friend_request = table(
  {
    name: "friend_request",
    public: true,
    indexes: [
      {
        accessor: "friend_request_from_identity",
        name: "friend_request_from_identity",
        algorithm: "btree",
        columns: ["fromIdentity"],
      },
      {
        accessor: "friend_request_to_identity",
        name: "friend_request_to_identity",
        algorithm: "btree",
        columns: ["toIdentity"],
      },
      {
        accessor: "friend_request_status",
        name: "friend_request_status",
        algorithm: "btree",
        columns: ["status"],
      },
    ],
  },
  {
    requestId: t.string().primaryKey(),
    fromIdentity: t.identity(),
    toIdentity: t.identity(),
    status: t.string(),
    createdAt: t.timestamp(),
    respondedAt: t.timestamp().optional(),
  },
);

export const friendship = table(
  {
    name: "friendship",
    public: true,
    indexes: [
      {
        accessor: "friendship_user_a",
        name: "friendship_user_a",
        algorithm: "btree",
        columns: ["userA"],
      },
      {
        accessor: "friendship_user_b",
        name: "friendship_user_b",
        algorithm: "btree",
        columns: ["userB"],
      },
    ],
  },
  {
    friendshipKey: t.string().primaryKey(),
    userA: t.identity(),
    userB: t.identity(),
    createdAt: t.timestamp(),
  },
);

export const player_presence = table(
  {
    name: "player_presence",
    public: true,
    indexes: [
      {
        accessor: "player_presence_activity",
        name: "player_presence_activity",
        algorithm: "btree",
        columns: ["activity"],
      },
    ],
  },
  {
    playerIdentity: t.identity().primaryKey(),
    username: t.string(),
    connected: t.bool(),
    activity: t.string(),
    currentRoomId: t.string().optional(),
    lastSeenAt: t.timestamp(),
  },
);

export const game_invite = table(
  {
    name: "game_invite",
    public: true,
    indexes: [
      {
        accessor: "game_invite_from_identity",
        name: "game_invite_from_identity",
        algorithm: "btree",
        columns: ["fromIdentity"],
      },
      {
        accessor: "game_invite_to_identity",
        name: "game_invite_to_identity",
        algorithm: "btree",
        columns: ["toIdentity"],
      },
      {
        accessor: "game_invite_status",
        name: "game_invite_status",
        algorithm: "btree",
        columns: ["status"],
      },
      {
        accessor: "game_invite_room_id",
        name: "game_invite_room_id",
        algorithm: "btree",
        columns: ["roomId"],
      },
    ],
  },
  {
    inviteId: t.string().primaryKey(),
    fromIdentity: t.identity(),
    toIdentity: t.identity(),
    roomId: t.string().optional(),
    status: t.string(),
    createdAt: t.timestamp(),
    respondedAt: t.timestamp().optional(),
  },
);

export const user_notification = table(
  {
    name: "user_notification",
    public: true,
    indexes: [
      {
        accessor: "user_notification_recipient_identity",
        name: "user_notification_recipient_identity",
        algorithm: "btree",
        columns: ["recipientIdentity"],
      },
      {
        accessor: "user_notification_invite_id",
        name: "user_notification_invite_id",
        algorithm: "btree",
        columns: ["inviteId"],
      },
      {
        accessor: "user_notification_friend_request_id",
        name: "user_notification_friend_request_id",
        algorithm: "btree",
        columns: ["friendRequestId"],
      },
    ],
  },
  {
    notificationId: t.string().primaryKey(),
    recipientIdentity: t.identity(),
    notificationType: t.string(),
    actorIdentity: t.identity().optional(),
    roomId: t.string().optional(),
    inviteId: t.string().optional(),
    friendRequestId: t.string().optional(),
    message: t.string(),
    isRead: t.bool(),
    createdAt: t.timestamp(),
    readAt: t.timestamp().optional(),
  },
);
