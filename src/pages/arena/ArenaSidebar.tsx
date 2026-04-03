import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Identity } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";
import { reducers, tables } from "../../module_bindings";
import { mockFriends } from "./arena-data";
import {
  panelFrameClass,
  panelNoiseClass,
  arenaActionClass,
  arenaInputClass,
} from "../../components/uiClasses";

type ArenaSidebarProps = {
  identity: Identity | undefined;
  arenaReady: boolean;
  userSlug: string;
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
  userSlug,
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
  const startArenaMatch = useReducer(reducers.startArenaMatch);
  const kickArenaMember = useReducer(reducers.kickArenaMember);

  const [arenaRoomRows] = useTable(tables.arenaRoom);
  const [arenaMemberRows] = useTable(tables.arenaRoomMember);
  const [arenaRoomNoticeRows] = useTable(tables.arenaRoomNotice);

  const activeRoom = useMemo(() => {
    if (!activeRoomId) return null;
    return arenaRoomRows.find((room) => room.roomId === activeRoomId) ?? null;
  }, [activeRoomId, arenaRoomRows]);

  const activeRoomMembers = useMemo(() => {
    if (!activeRoom) return [];
    return arenaMemberRows
      .filter((member) => member.roomId === activeRoom.roomId)
      .sort((left, right) => {
        if (
          left.joinedAt.microsSinceUnixEpoch <
          right.joinedAt.microsSinceUnixEpoch
        )
          return -1;
        if (
          left.joinedAt.microsSinceUnixEpoch >
          right.joinedAt.microsSinceUnixEpoch
        )
          return 1;
        return 0;
      });
  }, [activeRoom, arenaMemberRows]);

  const isArenaAdmin = Boolean(
    activeRoom && identity && activeRoom.creatorIdentity.isEqual(identity),
  );
  const isLobbyReady = Boolean(activeRoom && activeRoomMembers.length >= 2);
  const isCurrentUserInActiveRoom = Boolean(
    identity &&
      activeRoom &&
      activeRoomMembers.some((member) => member.memberIdentity.isEqual(identity)),
  );
  const onlineFriends = useMemo(
    () => mockFriends.filter((friend) => friend.isOnline),
    [],
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
      const message =
        error instanceof Error ? error.message : "Unable to create room.";
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

    const existingRoom = arenaRoomRows.find(
      (room) => room.roomId === normalizedRoomCode,
    );
    if (!existingRoom) {
      pushStatus(`Room ${normalizedRoomCode} was not found.`, "error");
      return;
    }

    try {
      await joinArenaRoom({ roomId: normalizedRoomCode });
      setActiveRoomId(normalizedRoomCode);
      pushStatus(`Connected to arena ${normalizedRoomCode}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to join this room.";
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

    if (activeRoom.matchState !== "started") {
      return;
    }

    if (location.pathname.endsWith("/powerups")) {
      return;
    }

    const query = new URLSearchParams({ room: activeRoom.roomId });
    navigate(
      `/user/${encodeURIComponent(userSlug)}/powerups?${query.toString()}`,
    );
  }, [
    activeRoom,
    isCurrentUserInActiveRoom,
    location.pathname,
    navigate,
    userSlug,
  ]);

  const handleStartMatch = async () => {
    if (!activeRoom) return;
    try {
      await startArenaMatch({ roomId: activeRoom.roomId });
      pushStatus(`Match started in room ${activeRoom.roomId}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start this match.";
      pushStatus(message, "error");
    }
  };

  const handleKickMember = async (memberId: bigint) => {
    if (!activeRoom) return;
    try {
      await kickArenaMember({ roomId: activeRoom.roomId, memberId });
      pushStatus("User removed from room.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to kick this user.";
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
      const message =
        error instanceof Error ? error.message : "Unable to delete room.";
      pushStatus(message, "error");
    }
  };

  return (
    <aside className="space-y-5">
      <section
        className={`${panelFrameClass} border-[rgba(0,229,204,0.24)] bg-[rgba(6,11,18,0.72)] p-5`}
      >
        <div className={panelNoiseClass} />
        <div className="relative z-1 space-y-5">
          <div>
            <p className="text-sm font-bold tracking-[0.14em] text-(--arena-accent) uppercase">
              Quick Arena
            </p>
          </div>

          <div className="inline-flex w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(241,243,252,0.06)] p-1">
            <button
              type="button"
              onClick={() => setArenaMode("create")}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition ${
                arenaMode === "create"
                  ? "bg-[rgba(0,229,204,0.16)] text-(--on-background)"
                  : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
              }`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setArenaMode("join")}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition ${
                arenaMode === "join"
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

              {activeRoom && (
                <section className="space-y-4 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(5,10,16,0.74)] p-4">
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-(--font-mono) text-[0.62rem] tracking-[0.16em] text-(--secondary) uppercase">
                        Arena Room Card
                      </p>
                      <h3 className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-[-0.02em]">
                        <span>Room {activeRoom.roomId}</span>
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
                      {roomCodeCopied && (
                        <p className="mt-1 text-[0.66rem] font-medium tracking-[0.08em] text-(--secondary) uppercase">
                          Copied
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-[rgba(241,243,252,0.22)] px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.08em] uppercase transition hover:border-[rgba(0,255,255,0.35)]"
                      onClick={() => {
                        void handleDeleteRoom();
                      }}
                      disabled={!isArenaAdmin}
                    >
                      Delete Room
                    </button>
                  </header>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <article className="rounded-xl border border-[rgba(241,243,252,0.12)] bg-[rgba(5,10,16,0.82)] p-2.5">
                      <p className="font-[var(--font-mono)] text-[0.56rem] tracking-[0.14em] text-[rgba(241,243,252,0.58)] uppercase">
                        Room ID
                      </p>
                      <p className="mt-1 text-xs font-semibold">{activeRoom.roomId}</p>
                    </article>
                    <article className="rounded-xl border border-[rgba(241,243,252,0.12)] bg-[rgba(5,10,16,0.82)] p-2.5">
                      <p className="font-[var(--font-mono)] text-[0.56rem] tracking-[0.14em] text-[rgba(241,243,252,0.58)] uppercase">
                        Creator
                      </p>
                      <p className="mt-1 text-xs font-semibold">{activeRoom.creatorName}</p>
                    </article>
                    <article className="rounded-xl border border-[rgba(241,243,252,0.12)] bg-[rgba(5,10,16,0.82)] p-2.5">
                      <p className="font-[var(--font-mono)] text-[0.56rem] tracking-[0.14em] text-[rgba(241,243,252,0.58)] uppercase">
                        Match
                      </p>
                      <p className="mt-1 text-xs font-semibold">
                        {activeRoom.matchState.toUpperCase()}
                      </p>
                    </article>
                  </div>

                  <section className="rounded-xl border border-[rgba(241,243,252,0.12)] bg-[rgba(5,10,16,0.82)] p-3">
                    <p className="font-[var(--font-mono)] text-[0.62rem] tracking-[0.16em] text-[rgba(241,243,252,0.62)] uppercase">
                      Joined Users ({activeRoomMembers.length})
                    </p>

                    <ul className="mt-2 space-y-2">
                      {activeRoomMembers.map((member) => (
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
                            {member.memberIdentity.isEqual(activeRoom.creatorIdentity) && (
                              <span className="rounded-full border border-[rgba(224,141,255,0.34)] px-2 py-1 font-[var(--font-mono)] text-[0.58rem] tracking-[0.08em] uppercase">
                                ADMIN
                              </span>
                            )}
                            {identity && member.memberIdentity.isEqual(identity) && (
                              <span className="rounded-full border border-[rgba(0,255,255,0.34)] px-2 py-1 font-[var(--font-mono)] text-[0.58rem] tracking-[0.08em] text-(--secondary) uppercase">
                                YOU
                              </span>
                            )}
                            {isArenaAdmin &&
                              !member.memberIdentity.isEqual(activeRoom.creatorIdentity) && (
                                <button
                                  type="button"
                                  className="rounded-lg border border-[rgba(224,141,255,0.35)] bg-[rgba(45,22,41,0.72)] px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.08em] uppercase"
                                  onClick={() => {
                                    void handleKickMember(member.memberId);
                                  }}
                                >
                                  Kick
                                </button>
                              )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <div className="space-y-2">
                    <button
                      type="button"
                      className={`${arenaActionClass} w-full ${isLobbyReady && isArenaAdmin ? "animate-pulse" : ""}`}
                      onClick={handleStartMatch}
                      disabled={!isArenaAdmin}
                    >
                      {activeRoom.matchState === "started" ? "Match Started" : "Start Match"}
                    </button>

                    {!isArenaAdmin && (
                      <p className="text-xs text-[rgba(241,243,252,0.62)]">
                        Only {activeRoom.creatorName} can start the match and kick users.
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="font-(--font-mono) text-[0.72rem] tracking-[0.22em] text-[rgba(241,243,252,0.62)] uppercase">
                Room Code
              </label>
              <p className="text-sm text-[rgba(241,243,252,0.58)]">
                Enter a room code to join an existing arena.
              </p>
              <input
                className={arenaInputClass}
                type="text"
                value={roomCodeInput}
                onChange={(event) => setRoomCodeInput(event.target.value)}
                autoComplete="off"
                placeholder="ENTER 6-CHAR ROOM CODE"
                disabled={!arenaReady}
              />
              <button
                className={arenaActionClass}
                type="button"
                onClick={handleJoinArena}
                disabled={!arenaReady}
              >
                Join Arena
              </button>
            </div>
          )}

          {statusMessage && (
            <div
              className={
                statusTone === "error"
                  ? "rounded-2xl border border-[rgba(224,141,255,0.25)] bg-[rgba(45,22,41,0.72)] px-4 py-3 text-sm text-(--on-background)"
                  : "rounded-2xl border border-[rgba(224,141,255,0.18)] bg-[rgba(29,18,39,0.48)] px-4 py-3 text-sm text-[rgba(241,243,252,0.78)]"
              }
            >
              {statusMessage}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(6,11,18,0.72)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-[0.12em] text-[rgba(241,243,252,0.6)] uppercase">
            Friends Online ({onlineFriends.length})
          </h3>
          <Link
            to="friends"
            className="text-xs text-(--arena-accent) transition hover:underline"
          >
            See All
          </Link>
        </div>

        <div className="space-y-3">
          {mockFriends.slice(0, 4).map((friend) => (
            <div key={friend.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgba(241,243,252,0.08)] text-xs font-bold text-(--on-background)">
                    {friend.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[rgba(6,11,18,0.95)] ${
                      friend.isOnline ? "bg-(--signal-success)" : "bg-[rgba(241,243,252,0.5)]"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-(--on-background)">{friend.username}</p>
                  <p className="text-xs text-[rgba(241,243,252,0.52)]">
                    {friend.isOnline ? "Online" : "Away"}
                  </p>
                </div>
              </div>

              {friend.isOnline ? (
                <button
                  type="button"
                  className="h-7 rounded-md px-2 text-xs text-[rgba(241,243,252,0.78)] transition hover:bg-[rgba(0,229,204,0.12)] hover:text-(--arena-accent)"
                >
                  Challenge
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
