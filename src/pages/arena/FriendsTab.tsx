import { useMemo, useState } from "react";
import { Check, Search, Swords, UserPlus, X } from "lucide-react";
import type { Identity } from "spacetimedb";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useReducer, useTable } from "spacetimedb/react";
import { reducers, tables } from "../../module_bindings";

type FriendsTabProps = {
  identity: Identity | undefined;
  username: string;
};

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function getAvatarTone(name: string) {
  const tones = [
    "bg-[rgba(0,229,204,0.12)] text-(--arena-accent)",
    "bg-[rgba(77,143,255,0.12)] text-(--tertiary)",
    "bg-[rgba(224,141,255,0.12)] text-(--primary)",
    "bg-[rgba(124,216,124,0.12)] text-(--signal-success)",
  ];
  const seed = name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return tones[seed % tones.length];
}

function getRoomCode(rawRoomId?: string | null) {
  if (!rawRoomId) return null;

  const normalized = rawRoomId.trim().toUpperCase();
  const tokens = normalized.split(/[^A-Z0-9]+/);
  const roomCode = tokens.find((token) => /^[A-Z0-9]{6}$/.test(token));

  return roomCode ?? normalized;
}

function formatPresence(activity: string, connected: boolean, roomId?: string) {
  const roomCode = getRoomCode(roomId);
  if (!connected) return "Offline";
  if (activity === "in_match") return roomCode ? `In Match • ${roomCode}` : "In Match";
  if (activity === "in_lobby") return roomCode ? `In Lobby • ${roomCode}` : "In Lobby";
  return "Online";
}

function getChallengeStatus(
  connected: boolean,
  activity: string | undefined,
  hasOutgoingInvite: boolean,
) {
  if (hasOutgoingInvite) {
    return { canChallenge: false, label: "Invite Sent" };
  }

  if (!connected) {
    return { canChallenge: false, label: "Offline" };
  }

  if (activity === "in_match") {
    return { canChallenge: false, label: "In Match" };
  }

  return { canChallenge: true, label: "Challenge" };
}

function identityKey(identity: Identity) {
  return identity.toHexString();
}

function getNotificationLabel(notificationType: string) {
  return notificationType.replace(/_/g, " ");
}

export function FriendsTab({ identity, username }: FriendsTabProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [friendUsernameInput, setFriendUsernameInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const isNotificationsView = searchParams.get("view") === "notifications";

  const [friendshipRows] = useTable(tables.friendship);
  const [friendRequestRows] = useTable(tables.friendRequest);
  const [playerPresenceRows] = useTable(tables.playerPresence);
  const [gameInviteRows] = useTable(tables.gameInvite);
  const [notificationRows] = useTable(tables.userNotification);
  const [rivalEntryRows] = useTable(tables.rivalEntry);
  const [sessionRows] = useTable(tables.authSession);

  const sendFriendRequest = useReducer(reducers.sendFriendRequest);
  const acceptFriendRequest = useReducer(reducers.acceptFriendRequest);
  const declineFriendRequest = useReducer(reducers.declineFriendRequest);
  const cancelFriendRequest = useReducer(reducers.cancelFriendRequest);
  const removeFriend = useReducer(reducers.removeFriend);
  const sendGameInvite = useReducer(reducers.sendGameInvite);
  const acceptGameInvite = useReducer(reducers.acceptGameInvite);
  const declineGameInvite = useReducer(reducers.declineGameInvite);
  const cancelGameInvite = useReducer(reducers.cancelGameInvite);
  const markNotificationRead = useReducer(reducers.markNotificationRead);

  const sessionByIdentity = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of sessionRows) {
      map.set(identityKey(session.sessionIdentity), session.username);
    }
    return map;
  }, [sessionRows]);

  const presenceByIdentity = useMemo(() => {
    const map = new Map<string, (typeof playerPresenceRows)[number]>();
    for (const presence of playerPresenceRows) {
      map.set(identityKey(presence.playerIdentity), presence);
    }
    return map;
  }, [playerPresenceRows]);

  const friendships = useMemo(() => {
    if (!identity) return [];

    return friendshipRows
      .filter((row) => row.userA.isEqual(identity) || row.userB.isEqual(identity))
      .map((row) => {
        const friendIdentity = row.userA.isEqual(identity) ? row.userB : row.userA;
        const friendKey = identityKey(friendIdentity);
        const presence = presenceByIdentity.get(friendKey);

        return {
          friendshipKey: row.friendshipKey,
          friendIdentity,
          friendKey,
          username:
            presence?.username ??
            sessionByIdentity.get(friendKey) ??
            friendKey.slice(0, 8),
          presence,
        };
      })
      .sort((left, right) => left.username.localeCompare(right.username));
  }, [friendshipRows, identity, presenceByIdentity, sessionByIdentity]);

  const incomingFriendRequests = useMemo(() => {
    if (!identity) return [];

    return friendRequestRows
      .filter((request) => request.toIdentity.isEqual(identity) && request.status === "pending")
      .map((request) => {
        const senderKey = identityKey(request.fromIdentity);
        return {
          ...request,
          senderName:
            presenceByIdentity.get(senderKey)?.username ??
            sessionByIdentity.get(senderKey) ??
            senderKey.slice(0, 8),
        };
      });
  }, [friendRequestRows, identity, presenceByIdentity, sessionByIdentity]);

  const outgoingFriendRequests = useMemo(() => {
    if (!identity) return [];

    return friendRequestRows
      .filter((request) => request.fromIdentity.isEqual(identity) && request.status === "pending")
      .map((request) => {
        const recipientKey = identityKey(request.toIdentity);
        return {
          ...request,
          recipientName:
            presenceByIdentity.get(recipientKey)?.username ??
            sessionByIdentity.get(recipientKey) ??
            recipientKey.slice(0, 8),
        };
      });
  }, [friendRequestRows, identity, presenceByIdentity, sessionByIdentity]);

  const incomingInvites = useMemo(() => {
    if (!identity) return [];

    return gameInviteRows
      .filter((invite) => invite.toIdentity.isEqual(identity) && invite.status === "pending")
      .map((invite) => {
        const challengerKey = identityKey(invite.fromIdentity);
        return {
          ...invite,
          challengerName:
            presenceByIdentity.get(challengerKey)?.username ??
            sessionByIdentity.get(challengerKey) ??
            challengerKey.slice(0, 8),
          roomCode: getRoomCode(invite.roomId),
        };
      });
  }, [gameInviteRows, identity, presenceByIdentity, sessionByIdentity]);

  const outgoingInvites = useMemo(() => {
    if (!identity) return [];

    return gameInviteRows
      .filter((invite) => invite.fromIdentity.isEqual(identity) && invite.status === "pending")
      .map((invite) => {
        const recipientKey = identityKey(invite.toIdentity);
        return {
          ...invite,
          recipientName:
            presenceByIdentity.get(recipientKey)?.username ??
            sessionByIdentity.get(recipientKey) ??
            recipientKey.slice(0, 8),
          roomCode: getRoomCode(invite.roomId),
        };
      });
  }, [gameInviteRows, identity, presenceByIdentity, sessionByIdentity]);

  const notifications = useMemo(() => {
    if (!identity) return [];

    return notificationRows
      .filter((row) => row.recipientIdentity.isEqual(identity))
      .sort((left, right) => {
        if (left.createdAt.microsSinceUnixEpoch > right.createdAt.microsSinceUnixEpoch) return -1;
        if (left.createdAt.microsSinceUnixEpoch < right.createdAt.microsSinceUnixEpoch) return 1;
        return 0;
      });
  }, [identity, notificationRows]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications],
  );

  const outgoingInviteByFriendKey = useMemo(() => {
    const map = new Map<string, (typeof outgoingInvites)[number]>();
    for (const invite of outgoingInvites) {
      map.set(identityKey(invite.toIdentity), invite);
    }
    return map;
  }, [outgoingInvites]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFriends = useMemo(
    () =>
      friendships.filter(
        (friend) =>
          normalizedQuery.length === 0 ||
          friend.username.toLowerCase().includes(normalizedQuery),
      ),
    [friendships, normalizedQuery],
  );

  const friendshipKeys = useMemo(() => {
    return new Set(friendships.map((friend) => friend.friendKey));
  }, [friendships]);

  const incomingFriendRequestBySenderKey = useMemo(() => {
    const map = new Map<string, (typeof incomingFriendRequests)[number]>();
    for (const request of incomingFriendRequests) {
      map.set(identityKey(request.fromIdentity), request);
    }
    return map;
  }, [incomingFriendRequests]);

  const outgoingFriendRequestByRecipientKey = useMemo(() => {
    const map = new Map<string, (typeof outgoingFriendRequests)[number]>();
    for (const request of outgoingFriendRequests) {
      map.set(identityKey(request.toIdentity), request);
    }
    return map;
  }, [outgoingFriendRequests]);

  const rivals = useMemo(() => {
    if (!identity) return [];

    return rivalEntryRows
      .filter((row) => row.ownerIdentity.isEqual(identity))
      .map((row) => {
        const rivalKey = identityKey(row.rivalIdentity);
        const presence = presenceByIdentity.get(rivalKey);
        return {
          rivalKey: row.rivalKey,
          rivalIdentity: row.rivalIdentity,
          rivalIdentityKey: rivalKey,
          username: presence?.username ?? row.rivalUsername,
          presence,
          lastMatchedAt: row.lastMatchedAt,
        };
      })
      .filter((rival) => !friendshipKeys.has(rival.rivalIdentityKey))
      .filter(
        (rival) =>
          normalizedQuery.length === 0 ||
          rival.username.toLowerCase().includes(normalizedQuery),
      )
      .sort((left, right) => left.username.localeCompare(right.username));
  }, [
    friendshipKeys,
    identity,
    normalizedQuery,
    playerPresenceRows,
    presenceByIdentity,
    rivalEntryRows,
  ]);

  const runAction = async (key: string, action: () => Promise<void>, onSuccess?: () => void) => {
    setSubmitting(key);
    setStatusMessage(null);
    try {
      await action();
      onSuccess?.();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to complete this action.");
    } finally {
      setSubmitting(null);
    }
  };

  const openFriendsView = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("view");
    setSearchParams(nextParams, { replace: true });
  };

  const handleAcceptInvite = async (inviteId: string) => {
    await runAction(`accept-invite:${inviteId}`, async () => {
      await acceptGameInvite({ inviteId });
    }, () => {
      setStatusMessage("Invite accepted. Entering the room.");
      navigate(`/${encodeURIComponent(username)}`);
    });
  };

  if (isNotificationsView) {
    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-(--on-background) sm:text-4xl">
              Notification Center
            </h2>
            <p className="mt-1 text-sm text-[rgba(241,243,252,0.58)]">
              Incoming requests, incoming challenges, and recent alerts all live here.
            </p>
          </div>
          <button
            type="button"
            onClick={openFriendsView}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.14)] px-4 text-sm font-semibold text-(--on-background)"
          >
            Back to Friends
          </button>
        </div>

        {statusMessage ? (
          <div className="rounded-xl border border-[rgba(0,229,204,0.24)] bg-[rgba(0,229,204,0.08)] px-4 py-3 text-sm text-[rgba(214,255,249,0.92)]">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] p-5">
            <h3 className="text-sm font-semibold text-(--on-background)">Incoming Friend Requests</h3>
            <div className="mt-4 space-y-3">
              {incomingFriendRequests.map((request) => (
                <article key={request.requestId} className="rounded-lg border border-[rgba(255,255,255,0.08)] p-4">
                  <p className="text-sm text-(--on-background)">{request.senderName}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void runAction(`accept-friend:${request.requestId}`, async () => {
                          await acceptFriendRequest({ requestId: request.requestId });
                        }, () => setStatusMessage(`You and ${request.senderName} are now friends.`));
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[rgba(0,229,204,0.35)] px-3 text-xs font-semibold uppercase"
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void runAction(`decline-friend:${request.requestId}`, async () => {
                          await declineFriendRequest({ requestId: request.requestId });
                        });
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.14)] px-3 text-xs font-semibold uppercase"
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </button>
                  </div>
                </article>
              ))}
              {incomingFriendRequests.length === 0 ? (
                <p className="text-sm text-[rgba(241,243,252,0.52)]">No incoming friend requests.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] p-5">
            <h3 className="text-sm font-semibold text-(--on-background)">Incoming Match Invites</h3>
            <div className="mt-4 space-y-3">
              {incomingInvites.map((invite) => (
                <article key={invite.inviteId} className="rounded-lg border border-[rgba(255,255,255,0.08)] p-4">
                  <p className="text-sm text-(--on-background)">
                    {invite.challengerName} invited you to room {invite.roomCode ?? "pending"}.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void handleAcceptInvite(invite.inviteId);
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[rgba(0,229,204,0.35)] px-3 text-xs font-semibold uppercase"
                    >
                      <Check className="h-3.5 w-3.5" /> Join Room
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void runAction(`decline-invite:${invite.inviteId}`, async () => {
                          await declineGameInvite({ inviteId: invite.inviteId });
                        });
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.14)] px-3 text-xs font-semibold uppercase"
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </button>
                  </div>
                </article>
              ))}
              {incomingInvites.length === 0 ? (
                <p className="text-sm text-[rgba(241,243,252,0.52)]">No incoming game invites.</p>
              ) : null}
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-(--on-background)">All Notifications</h3>
              <p className="mt-1 text-sm text-[rgba(241,243,252,0.52)]">
                {unreadNotifications.length} unread
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.notificationId}
                className={`rounded-xl border p-4 ${
                  notification.isRead
                    ? "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]"
                    : "border-[rgba(0,229,204,0.24)] bg-[rgba(0,229,204,0.08)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-(--on-background)">{notification.message}</p>
                    {notification.roomId ? (
                      <p className="mt-1 text-xs text-[rgba(241,243,252,0.62)]">
                        Room code: {getRoomCode(notification.roomId)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[0.72rem] text-[rgba(241,243,252,0.52)] uppercase">
                      {getNotificationLabel(notification.notificationType)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={notification.isRead}
                    onClick={() => {
                      void runAction(`notification:${notification.notificationId}`, async () => {
                        await markNotificationRead({ notificationId: notification.notificationId });
                      });
                    }}
                    className="rounded-md border border-[rgba(255,255,255,0.14)] px-2 py-1 text-[0.68rem] uppercase text-[rgba(241,243,252,0.72)] disabled:opacity-50"
                  >
                    {notification.isRead ? "Read" : "Mark Read"}
                  </button>
                </div>
              </article>
            ))}
            {notifications.length === 0 ? (
              <p className="text-sm text-[rgba(241,243,252,0.52)]">No notifications yet.</p>
            ) : null}
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-(--on-background) sm:text-4xl">
            Rivals <span className="text-(--arena-accent)">&</span> Allies
          </h2>
          <p className="mt-1 text-sm text-[rgba(241,243,252,0.58)]">
            Search your friends, send challenges, and manage your outgoing requests.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(241,243,252,0.45)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search friends..."
              className="h-10 w-52 rounded-lg border border-[rgba(241,243,252,0.12)] bg-[rgba(241,243,252,0.06)] pl-9 pr-3 text-sm text-(--on-background) outline-none transition placeholder:text-[rgba(241,243,252,0.45)] focus:border-[rgba(0,229,204,0.45)]"
            />
          </label>

          <div className="flex items-center gap-2 rounded-lg border border-[rgba(241,243,252,0.12)] bg-[rgba(241,243,252,0.06)] p-1">
            <input
              type="text"
              value={friendUsernameInput}
              onChange={(event) => setFriendUsernameInput(event.target.value)}
              placeholder="Friend username"
              className="h-8 w-40 bg-transparent px-2 text-sm text-(--on-background) outline-none placeholder:text-[rgba(241,243,252,0.45)]"
            />
            <button
              type="button"
              disabled={!friendUsernameInput.trim() || submitting === "send-friend"}
              onClick={() => {
                void runAction("send-friend", async () => {
                  await sendFriendRequest({ username: friendUsernameInput });
                }, () => {
                  setFriendUsernameInput("");
                  setStatusMessage("Friend request sent.");
                });
              }}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-[rgba(0,229,204,0.38)] bg-[rgba(0,229,204,0.12)] px-3 text-sm font-semibold text-(--on-background) transition hover:bg-[rgba(0,229,204,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-xl border border-[rgba(0,229,204,0.24)] bg-[rgba(0,229,204,0.08)] px-4 py-3 text-sm text-[rgba(214,255,249,0.92)]">
          {statusMessage}
        </div>
      ) : null}

      {outgoingFriendRequests.length > 0 || outgoingInvites.length > 0 ? (
        <section className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] p-5">
          <h3 className="text-sm font-semibold text-(--on-background)">Outgoing</h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {outgoingFriendRequests.map((request) => (
              <article key={request.requestId} className="rounded-lg border border-[rgba(255,255,255,0.08)] p-4">
                <p className="text-sm text-(--on-background)">Friend request sent to {request.recipientName}</p>
                <button
                  type="button"
                  onClick={() => {
                    void runAction(`cancel-request:${request.requestId}`, async () => {
                      await cancelFriendRequest({ requestId: request.requestId });
                    });
                  }}
                  className="mt-3 inline-flex h-9 items-center rounded-lg border border-[rgba(255,255,255,0.14)] px-3 text-xs font-semibold uppercase"
                >
                  Cancel Request
                </button>
              </article>
            ))}
            {outgoingInvites.map((invite) => (
              <article key={invite.inviteId} className="rounded-lg border border-[rgba(255,255,255,0.08)] p-4">
                <p className="text-sm text-(--on-background)">
                  Waiting for {invite.recipientName}
                  {invite.roomCode ? ` in room ${invite.roomCode}` : "."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void runAction(`cancel-match:${invite.inviteId}`, async () => {
                      await cancelGameInvite({ inviteId: invite.inviteId });
                    });
                  }}
                  className="mt-3 inline-flex h-9 items-center rounded-lg border border-[rgba(255,255,255,0.14)] px-3 text-xs font-semibold uppercase"
                >
                  Cancel Invite
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {rivals.length > 0 ? (
        <section className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-(--on-background)">Rivals</h3>
              <p className="mt-1 text-sm text-[rgba(241,243,252,0.52)]">
                Players you have battled recently. Add them as friends or keep them as targets.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rivals.map((rival) => {
              const incomingRequest = incomingFriendRequestBySenderKey.get(
                rival.rivalIdentityKey,
              );
              const outgoingRequest = outgoingFriendRequestByRecipientKey.get(
                rival.rivalIdentityKey,
              );

              return (
                <article
                  key={rival.rivalKey}
                  className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4"
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className={`grid h-12 w-12 place-items-center rounded-xl text-sm font-bold ${getAvatarTone(rival.username)}`}>
                      {getInitials(rival.username)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-(--on-background)">
                        {rival.username}
                      </h4>
                      <p className="text-xs text-[rgba(241,243,252,0.52)]">
                        {formatPresence(
                          rival.presence?.activity ?? "offline",
                          rival.presence?.connected ?? false,
                          rival.presence?.currentRoomId,
                        )}
                      </p>
                    </div>
                  </div>

                  {incomingRequest ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void runAction(`accept-rival:${incomingRequest.requestId}`, async () => {
                            await acceptFriendRequest({ requestId: incomingRequest.requestId });
                          }, () => setStatusMessage(`You and ${rival.username} are now friends.`));
                        }}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-[rgba(0,229,204,0.35)] px-3 text-xs font-semibold uppercase"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void runAction(`decline-rival:${incomingRequest.requestId}`, async () => {
                            await declineFriendRequest({ requestId: incomingRequest.requestId });
                          });
                        }}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[rgba(255,255,255,0.14)] px-3 text-xs font-semibold uppercase"
                      >
                        <X className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  ) : outgoingRequest ? (
                    <button
                      type="button"
                      onClick={() => {
                        void runAction(`cancel-rival-request:${outgoingRequest.requestId}`, async () => {
                          await cancelFriendRequest({ requestId: outgoingRequest.requestId });
                        });
                      }}
                      className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-[rgba(255,255,255,0.14)] px-3 text-xs font-semibold uppercase text-[rgba(241,243,252,0.72)]"
                    >
                      Cancel Friend Request
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting === `rival-request:${rival.rivalIdentityKey}`}
                      onClick={() => {
                        void runAction(`rival-request:${rival.rivalIdentityKey}`, async () => {
                          await sendFriendRequest({ username: rival.username });
                        }, () => setStatusMessage(`Friend request sent to ${rival.username}.`));
                      }}
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[rgba(224,141,255,0.35)] bg-[rgba(224,141,255,0.08)] px-3 text-xs font-semibold uppercase text-(--on-background)"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Send Friend Request
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredFriends.map((friend) => {
          const outgoingInvite = outgoingInviteByFriendKey.get(friend.friendKey);
          const challengeStatus = getChallengeStatus(
            friend.presence?.connected ?? false,
            friend.presence?.activity,
            Boolean(outgoingInvite),
          );

          return (
            <article
              key={friend.friendshipKey}
              className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-12 w-12 place-items-center rounded-xl text-sm font-bold ${getAvatarTone(friend.username)}`}>
                    {getInitials(friend.username)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-(--on-background)">{friend.username}</h3>
                    <p className="text-xs text-[rgba(241,243,252,0.52)]">
                      {formatPresence(
                        friend.presence?.activity ?? "offline",
                        friend.presence?.connected ?? false,
                        friend.presence?.currentRoomId,
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void runAction(`remove:${friend.friendKey}`, async () => {
                      await removeFriend({ friendIdentity: friend.friendIdentity });
                    }, () => setStatusMessage(`Removed ${friend.username} from your friends.`));
                  }}
                  className="rounded-md border border-[rgba(255,255,255,0.12)] px-2 py-1 text-[0.68rem] uppercase text-[rgba(241,243,252,0.62)]"
                >
                  Remove
                </button>
              </div>

              <button
                type="button"
                disabled={!challengeStatus.canChallenge || submitting === `challenge:${friend.friendKey}`}
                onClick={() => {
                  void runAction(`challenge:${friend.friendKey}`, async () => {
                    await sendGameInvite({ friendIdentity: friend.friendIdentity });
                  }, () => setStatusMessage(`Challenge sent to ${friend.username}.`));
                }}
                className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-xs font-semibold tracking-[0.1em] uppercase transition ${
                  challengeStatus.canChallenge
                    ? "border-[rgba(0,229,204,0.35)] bg-[rgba(0,229,204,0.12)] text-(--on-background) hover:bg-[rgba(0,229,204,0.2)]"
                    : "border-[rgba(241,243,252,0.18)] text-[rgba(241,243,252,0.42)]"
                }`}
              >
                <Swords className="h-3.5 w-3.5" />
                {challengeStatus.label}
              </button>
            </article>
          );
        })}

        {filteredFriends.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-[rgba(255,255,255,0.12)] px-4 py-10 text-center text-sm text-[rgba(241,243,252,0.52)]">
            No friends match this view yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
