import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Identity } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";
import { reducers, tables } from "../../module_bindings";
import { getLeagueFromElo } from "../../lib/ranking";
import {
  panelFrameClass,
  panelNoiseClass,
  arenaActionClass,
  arenaInputClass,
} from "../../components/uiClasses";

type ArenaSidebarProps = {
  identity: Identity | undefined;
  arenaReady: boolean;
  username: string;
};

function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase();
}

function generateRoomId(existingRoomIds: Set<string>) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let attempts = 0;

  while (attempts < 50) {
    const roomId = Array.from({ length: 6 }, () => {
      return alphabet[Math.floor(Math.random() * alphabet.length)];
    }).join("");

    if (!existingRoomIds.has(roomId)) {
      return roomId;
    }

    attempts += 1;
  }

  return `${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

export function ArenaSidebar({
  identity,
  arenaReady,
  username,
}: ArenaSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [arenaMode, setArenaMode] = useState<"create" | "join">("create");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"neutral" | "error">("neutral");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const roomCodeCopiedTimeoutRef = useRef<number | null>(null);
  const latestTimeoutNoticeIdRef = useRef<bigint | null>(null);

  const createArenaRoom = useReducer(reducers.createArenaRoom);
  const deleteArenaRoom = useReducer(reducers.deleteArenaRoom);
  const joinArenaRoom = useReducer(reducers.joinArenaRoom);
  const leaveArenaRoom = useReducer(reducers.leaveArenaRoom);
  const startArenaMatch = useReducer(reducers.startArenaMatch);
  const kickArenaMember = useReducer(reducers.kickArenaMember);

  const [arenaRoomRows] = useTable(tables.arenaRoom);
  const [arenaMemberRows] = useTable(tables.arenaRoomMember);
  const [arenaRoomNoticeRows] = useTable(tables.arenaRoomNotice);

  const activeRoom = useMemo(() => {
    if (!activeRoomId) return null;
    return arenaRoomRows.find((room) => room.roomId === activeRoomId) ?? null;
  }, [activeRoomId, arenaRoomRows]);
  const activeLobbyRoom =
    activeRoom && activeRoom.matchState !== "finished" ? activeRoom : null;

  const activeRoomMembers = useMemo(() => {
    if (!activeRoom) return [];
    return arenaMemberRows
      .filter((member) => member.roomId === activeRoom.roomId)
      .sort((left, right) => {
        if (left.joinedAt.microsSinceUnixEpoch < right.joinedAt.microsSinceUnixEpoch) {
          return -1;
        }
        if (left.joinedAt.microsSinceUnixEpoch > right.joinedAt.microsSinceUnixEpoch) {
          return 1;
        }
        return 0;
      });
  }, [activeRoom, arenaMemberRows]);

  const activeLobbyRoomMembers = useMemo(() => {
    if (!activeLobbyRoom) return [];
    return activeRoomMembers;
  }, [activeLobbyRoom, activeRoomMembers]);

  useEffect(() => {
    if (!identity) {
      return;
    }

    const myMemberships = arenaMemberRows
      .filter((member) => member.memberIdentity.isEqual(identity))
      .sort((left, right) => {
        if (left.joinedAt.microsSinceUnixEpoch < right.joinedAt.microsSinceUnixEpoch) {
          return -1;
        }
        if (left.joinedAt.microsSinceUnixEpoch > right.joinedAt.microsSinceUnixEpoch) {
          return 1;
        }
        return 0;
      });

    if (myMemberships.length === 0) {
      if (activeRoomId !== null) {
        setActiveRoomId(null);
      }
      return;
    }

    const nextActiveRoomId =
      activeRoomId && myMemberships.some((member) => member.roomId === activeRoomId)
        ? activeRoomId
        : myMemberships[myMemberships.length - 1]?.roomId ?? null;

    if (nextActiveRoomId !== activeRoomId) {
      setActiveRoomId(nextActiveRoomId);
    }
  }, [activeRoomId, arenaMemberRows, identity]);

  const isArenaAdmin = Boolean(
    activeLobbyRoom && identity && activeLobbyRoom.creatorIdentity.isEqual(identity),
  );
  const isLobbyReady = Boolean(activeLobbyRoom && activeLobbyRoomMembers.length >= 2);
  const isCurrentUserInActiveRoom = Boolean(
    identity &&
    activeRoom &&
    activeRoomMembers.some((member) => member.memberIdentity.isEqual(identity)),
  );
  const [playerProfileRows] = useTable(tables.playerProfile);
  const [sessionRows] = useTable(tables.authSession);
  const onlineFriends = useMemo(
    () =>
      playerProfileRows
        .filter((profile) => profile.username !== username)
        .filter((profile) =>
          sessionRows.some(
            (session) => session.username === profile.username && session.connected,
          ),
        )
        .map((profile) => ({
          id: profile.usernameKey,
          username: profile.username,
          league: getLeagueFromElo(Number(profile.eloRating)),
        })),
    [playerProfileRows, sessionRows, username],
  );

  const pushStatus = (message: string, tone: "neutral" | "error" = "neutral") => {
    setStatusTone(tone);
    setStatusMessage(message);
  };

  useEffect(() => {
    return () => {
      if (roomCodeCopiedTimeoutRef.current !== null) {
        window.clearTimeout(roomCodeCopiedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeRoomId) {
      return;
    }

    const stillExists = arenaRoomRows.some((room) => room.roomId === activeRoomId);
    if (!stillExists) {
      setActiveRoomId(null);
    }
  }, [activeRoomId, arenaRoomRows]);

  useEffect(() => {
    const timeoutNotices = arenaRoomNoticeRows.filter(
      (notice) => notice.noticeType === "timeout_deleted",
    );
    if (timeoutNotices.length === 0) {
      return;
    }

    let latestNotice = timeoutNotices[0];
    for (const notice of timeoutNotices) {
      if (notice.noticeId > latestNotice.noticeId) {
        latestNotice = notice;
      }
    }

    if (latestTimeoutNoticeIdRef.current === latestNotice.noticeId) {
      return;
    }

    latestTimeoutNoticeIdRef.current = latestNotice.noticeId;
    pushStatus(latestNotice.message, "error");
  }, [arenaRoomNoticeRows]);

  const handleCreateArena = async () => {
    if (!identity) {
      pushStatus("Session identity is not ready yet.", "error");
      return;
    }
    if (!arenaReady) {
      pushStatus("Syncing arena tables...", "error");
      return;
    }

    const existingRoomIds = new Set(arenaRoomRows.map((room) => room.roomId));
    const roomId = generateRoomId(existingRoomIds);

    try {
      await createArenaRoom({ roomId });
      setActiveRoomId(roomId);
      setRoomCodeInput(roomId);
      setArenaMode("create");
      pushStatus(`Arena ${roomId} created. Share it with your rival.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create room.";
      pushStatus(message, "error");
    }
  };

  const handleJoinArena = async () => {
    if (!identity) {
      pushStatus("Session identity is not ready yet.", "error");
      return;
    }
    if (!arenaReady) {
      pushStatus("Syncing arena tables...", "error");
      return;
    }

    const normalizedRoomCode = normalizeRoomCode(roomCodeInput);
    if (!normalizedRoomCode) {
      pushStatus("Enter a room code to join.", "error");
      return;
    }

    const existingRoom = arenaRoomRows.find((room) => room.roomId === normalizedRoomCode);
    if (!existingRoom) {
      pushStatus(`Room ${normalizedRoomCode} was not found.`, "error");
      return;
    }

    try {
      await joinArenaRoom({ roomId: normalizedRoomCode });
      setActiveRoomId(normalizedRoomCode);
      setRoomCodeInput(normalizedRoomCode);
      setArenaMode("join");
      pushStatus(`Connected to arena ${normalizedRoomCode}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to join this room.";
      pushStatus(message, "error");
    }
  };

  useEffect(() => {
    if (!activeRoom) {
      return;
    }

    if (!isCurrentUserInActiveRoom) {
      return;
    }

    if (activeRoom.matchState === "waiting") {
      return;
    }

    const round = activeRoom.currentRound?.toString() ?? "1";
    const targetPath =
      activeRoom.matchState === "playing"
        ? `/${encodeURIComponent(username)}/room=${activeRoom.roomId}/r${round}`
        : activeRoom.matchState === "round_intro"
          ? `/${encodeURIComponent(username)}/room=${activeRoom.roomId}/r${round}/power-cards-locked`
          : `/${encodeURIComponent(username)}/room=${activeRoom.roomId}/r${round}/power-cards`;

    if (location.pathname === targetPath) {
      return;
    }

    const redirectKey = `arena-powerups-redirected:${username}:${activeRoom.roomId}`;
    if (window.sessionStorage.getItem(redirectKey) === "1") {
      return;
    }

    window.sessionStorage.setItem(redirectKey, "1");
    navigate(targetPath);
  }, [
    activeRoom,
    isCurrentUserInActiveRoom,
    location.pathname,
    navigate,
    username,
  ]);

  const handleStartMatch = async () => {
    if (!activeRoom) return;
    try {
      await startArenaMatch({ roomId: activeRoom.roomId });
      pushStatus(`Match started in room ${activeRoom.roomId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start this match.";
      pushStatus(message, "error");
    }
  };

  const handleKickMember = async (memberId: bigint) => {
    if (!activeRoom) return;
    try {
      await kickArenaMember({ roomId: activeRoom.roomId, memberId });
      pushStatus("User removed from room.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to kick this user.";
      pushStatus(message, "error");
    }
  };

  const handleCopyRoomCode = async () => {
    if (!activeRoom) return;
    try {
      await navigator.clipboard.writeText(activeRoom.roomId);
      setRoomCodeCopied(true);
      if (roomCodeCopiedTimeoutRef.current !== null) {
        window.clearTimeout(roomCodeCopiedTimeoutRef.current);
      }
      roomCodeCopiedTimeoutRef.current = window.setTimeout(() => {
        setRoomCodeCopied(false);
      }, 1500);
    } catch {
      pushStatus("Clipboard unavailable. Copy the room code manually.", "error");
    }
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom) {
      return;
    }

    try {
      await deleteArenaRoom({ roomId: activeRoom.roomId });
      setActiveRoomId(null);
      pushStatus(`Room ${activeRoom.roomId} deleted.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete room.";
      pushStatus(message, "error");
    }
  };

  const handleLeaveRoom = async () => {
    if (!activeLobbyRoom) {
      return;
    }

    try {
      await leaveArenaRoom({ roomId: activeLobbyRoom.roomId });
      setActiveRoomId(null);
      pushStatus(`Left room ${activeLobbyRoom.roomId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to leave room.";
      pushStatus(message, "error");
    }
  };

  return (
    <aside className="space-y-5">
      <section className={`${panelFrameClass} border-[rgba(0,229,204,0.24)] bg-[rgba(6,11,18,0.72)] p-5`}>
        <div className={panelNoiseClass} />
        <div className="relative z-1 space-y-5">
          {!activeLobbyRoom ? (
            <>
              <div>
                <p className="text-sm font-bold tracking-[0.14em] text-(--arena-accent) uppercase">
                  Quick Arena
                </p>
              </div>

              <div className="inline-flex w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(241,243,252,0.06)] p-1">
                <button
                  type="button"
                  onClick={() => setArenaMode("create")}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition ${arenaMode === "create"
                    ? "bg-[rgba(0,229,204,0.16)] text-(--on-background)"
                    : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
                    }`}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setArenaMode("join")}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition ${arenaMode === "join"
                    ? "bg-[rgba(0,229,204,0.16)] text-(--on-background)"
                    : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
                    }`}
                >
                  Join
                </button>
              </div>

              {arenaMode === "create" ? (
                <div className="space-y-3">
                  <p className="text-sm text-[rgba(241,243,252,0.58)]">
                    Create a private arena and invite a rival to duel.
                  </p>
                  <button
                    className={arenaActionClass}
                    type="button"
                    onClick={handleCreateArena}
                    disabled={!arenaReady}
                  >
                    {!arenaReady ? "Syncing Tables" : "Create Arena"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="space-y-2">
                    <span className="text-xs tracking-[0.08em] text-[rgba(241,243,252,0.58)] uppercase">
                      Room Code
                    </span>
                    <input
                      className={arenaInputClass}
                      value={roomCodeInput}
                      onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
                      placeholder="ENTER 6-CHAR ROOM CODE"
                      maxLength={6}
                    />
                  </label>
                  <button
                    className={arenaActionClass}
                    type="button"
                    onClick={handleJoinArena}
                    disabled={!arenaReady}
                  >
                    {!arenaReady ? "Syncing Tables" : "Join Arena"}
                  </button>
                </div>
              )}
            </>
          ) : null}

          {statusMessage ? (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${statusTone === "error"
                ? "border-[rgba(255,92,122,0.28)] bg-[rgba(255,92,122,0.08)] text-[rgba(255,207,214,0.92)]"
                : "border-[rgba(0,229,204,0.24)] bg-[rgba(0,229,204,0.08)] text-[rgba(214,255,249,0.92)]"
                }`}
            >
              {statusMessage}
            </div>
          ) : null}

          {activeLobbyRoom ? (
            <section className="space-y-4 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(5,10,16,0.74)] p-4">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-(--font-mono) text-[0.62rem] tracking-[0.16em] text-(--secondary) uppercase">
                    Arena Room Card
                  </p>
                  <h3 className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-[-0.02em]">
                    <span>Room {activeLobbyRoom.roomId}</span>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[rgba(241,243,252,0.22)] text-[rgba(241,243,252,0.76)] transition hover:border-[rgba(0,255,255,0.38)] hover:text-(--secondary)"
                      onClick={() => {
                        void handleCopyRoomCode();
                      }}
                      aria-label="Copy room code"
                      title="Copy room code"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-3.5 w-3.5"
                      >
                        <rect x="9" y="9" width="10" height="10" rx="2" />
                        <path d="M5 15V7a2 2 0 0 1 2-2h8" />
                      </svg>
                    </button>
                  </h3>
                  {roomCodeCopied ? (
                    <p className="mt-1 text-[0.66rem] font-medium tracking-[0.08em] text-(--secondary) uppercase">
                      Copied
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="rounded-md border border-[rgba(241,243,252,0.22)] px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.08em] uppercase transition hover:border-[rgba(0,255,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    if (isArenaAdmin) {
                      void handleDeleteRoom();
                      return;
                    }

                    void handleLeaveRoom();
                  }}
                >
                  {isArenaAdmin ? "Delete Room" : "Exit Room"}
                </button>
              </header>

              <div className="grid gap-2 sm:grid-cols-3">
                <article className="rounded-xl border border-[rgba(241,243,252,0.12)] bg-[rgba(5,10,16,0.82)] p-2.5">
                  <p className="font-[var(--font-mono)] text-[0.56rem] tracking-[0.14em] text-[rgba(241,243,252,0.58)] uppercase">
                    Room ID
                  </p>
                  <p className="mt-1 text-xs font-semibold">{activeLobbyRoom.roomId}</p>
                </article>
                <article className="rounded-xl border border-[rgba(241,243,252,0.12)] bg-[rgba(5,10,16,0.82)] p-2.5">
                  <p className="font-[var(--font-mono)] text-[0.56rem] tracking-[0.14em] text-[rgba(241,243,252,0.58)] uppercase">
                    Creator
                  </p>
                  <p className="mt-1 text-xs font-semibold">{activeLobbyRoom.creatorName}</p>
                </article>
                <article className="rounded-xl border border-[rgba(241,243,252,0.12)] bg-[rgba(5,10,16,0.82)] p-2.5">
                  <p className="font-[var(--font-mono)] text-[0.56rem] tracking-[0.14em] text-[rgba(241,243,252,0.58)] uppercase">
                    Match
                  </p>
                  <p className="mt-1 text-xs font-semibold">{activeLobbyRoom.matchState.toUpperCase()}</p>
                </article>
              </div>

              <section className="rounded-xl border border-[rgba(241,243,252,0.12)] bg-[rgba(5,10,16,0.82)] p-3">
                <p className="font-[var(--font-mono)] text-[0.62rem] tracking-[0.16em] text-[rgba(241,243,252,0.62)] uppercase">
                  Joined Users ({activeLobbyRoomMembers.length})
                </p>

                <ul className="mt-2 space-y-2">
                  {activeLobbyRoomMembers.map((member) => (
                    <li
                      key={member.memberId.toString()}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[rgba(241,243,252,0.1)] bg-[rgba(4,10,16,0.86)] px-2.5 py-2"
                    >
                      <div>
                        <p className="text-xs font-semibold">{member.memberName}</p>
                        <p className="text-[0.68rem] text-[rgba(241,243,252,0.6)]">
                          Joined {member.joinedAt.toDate().toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {member.memberIdentity.isEqual(activeLobbyRoom.creatorIdentity) ? (
                          <span className="rounded-full border border-[rgba(224,141,255,0.34)] px-2 py-1 font-[var(--font-mono)] text-[0.58rem] tracking-[0.08em] uppercase">
                            ADMIN
                          </span>
                        ) : null}
                        {identity && member.memberIdentity.isEqual(identity) ? (
                          <span className="rounded-full border border-[rgba(0,255,255,0.34)] px-2 py-1 font-[var(--font-mono)] text-[0.58rem] tracking-[0.08em] text-(--secondary) uppercase">
                            YOU
                          </span>
                        ) : null}
                        {isArenaAdmin &&
                          !member.memberIdentity.isEqual(activeLobbyRoom.creatorIdentity) ? (
                          <button
                            type="button"
                            className="rounded-lg border border-[rgba(224,141,255,0.35)] bg-[rgba(45,22,41,0.72)] px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.08em] uppercase"
                            onClick={() => {
                              void handleKickMember(member.memberId);
                            }}
                          >
                            Kick
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="space-y-2">
                <button
                  type="button"
                  className={`${arenaActionClass} w-full ${isLobbyReady && isArenaAdmin ? "animate-pulse" : ""}`}
                  onClick={() => {
                    void handleStartMatch();
                  }}
                  disabled={!isArenaAdmin}
                >
                  {activeLobbyRoom.matchState === "started" ? "Match Started" : "Start Match"}
                </button>

                {!isArenaAdmin ? (
                  <p className="text-xs text-[rgba(241,243,252,0.62)]">
                    Only {activeLobbyRoom.creatorName} can start the match and kick users.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <section className={`${panelFrameClass} p-5`}>
        <div className={panelNoiseClass} />
        <div className="relative z-1 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold tracking-[0.14em] text-(--arena-accent) uppercase">
              Rivals Online
            </p>
            <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[0.62rem] tracking-[0.08em] text-[rgba(241,243,252,0.5)] uppercase">
              {onlineFriends.length} online
            </span>
          </div>

          <div className="space-y-2">
            {onlineFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-(--on-background)">
                    {friend.username}
                  </p>
                  <p className="text-[0.68rem] tracking-[0.08em] text-[rgba(241,243,252,0.5)] uppercase">
                    {friend.league}
                  </p>
                </div>
                <Link
                  to={`/${encodeURIComponent(username)}/friends`}
                  className="rounded-md border border-[rgba(255,255,255,0.12)] px-2.5 py-1 text-[0.68rem] tracking-[0.08em] uppercase transition hover:border-[rgba(255,255,255,0.2)]"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </aside>
  );
}
