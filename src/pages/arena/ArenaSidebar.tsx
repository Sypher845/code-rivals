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
        if (left.joinedAt.microsSinceUnixEpoch < right.joinedAt.microsSinceUnixEpoch) {
          return -1;
        }
        if (left.joinedAt.microsSinceUnixEpoch > right.joinedAt.microsSinceUnixEpoch) {
          return 1;
        }
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

    if (activeRoom.matchState !== "started") {
      return;
    }

    if (
      location.pathname.includes("/powerups") ||
      location.pathname.includes("/match")
    ) {
      return;
    }

    const query = new URLSearchParams({ room: activeRoom.roomId });
    navigate(`/${encodeURIComponent(username)}/powerups?${query.toString()}`);
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

  return (
    <aside className="space-y-5">
      <section className={`${panelFrameClass} border-[rgba(0,229,204,0.24)] bg-[rgba(6,11,18,0.72)] p-5`}>
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
                Create Room
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
                  placeholder="ABC123"
                  maxLength={6}
                />
              </label>
              <button
                className={arenaActionClass}
                type="button"
                onClick={handleJoinArena}
                disabled={!arenaReady}
              >
                Join Room
              </button>
            </div>
          )}

          {statusMessage ? (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                statusTone === "error"
                  ? "border-[rgba(255,92,122,0.28)] bg-[rgba(255,92,122,0.08)] text-[rgba(255,207,214,0.92)]"
                  : "border-[rgba(0,229,204,0.24)] bg-[rgba(0,229,204,0.08)] text-[rgba(214,255,249,0.92)]"
              }`}
            >
              {statusMessage}
            </div>
          ) : null}

          {activeRoom ? (
            <div className="space-y-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,13,19,0.7)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.08em] text-[rgba(241,243,252,0.58)] uppercase">
                    Active Room
                  </p>
                  <p className="mt-1 font-(--font-mono) text-lg text-(--on-background)">
                    {activeRoom.roomId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyRoomCode();
                  }}
                  className="rounded-md border border-[rgba(255,255,255,0.12)] px-3 py-1.5 text-[0.68rem] tracking-[0.08em] uppercase transition hover:border-[rgba(255,255,255,0.2)]"
                >
                  {roomCodeCopied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="space-y-2">
                {activeRoomMembers.map((member) => (
                  <div
                    key={member.memberId.toString()}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-(--on-background)">
                        {member.memberName}
                      </p>
                      <p className="text-[0.68rem] tracking-[0.08em] text-[rgba(241,243,252,0.5)] uppercase">
                        Joined
                      </p>
                    </div>
                    {isArenaAdmin && !member.memberIdentity.isEqual(identity!) ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleKickMember(member.memberId);
                        }}
                        className="rounded-md border border-[rgba(255,92,122,0.24)] px-2.5 py-1 text-[0.68rem] tracking-[0.08em] text-[rgba(255,207,214,0.92)] uppercase transition hover:bg-[rgba(255,92,122,0.08)]"
                      >
                        Kick
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                {isArenaAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      void handleStartMatch();
                    }}
                    className={arenaActionClass}
                    disabled={!isLobbyReady}
                  >
                    Start Match
                  </button>
                ) : null}

                {isArenaAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteRoom();
                    }}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[rgba(255,92,122,0.24)] px-4 text-xs font-semibold tracking-[0.1em] text-[rgba(255,207,214,0.92)] uppercase transition hover:bg-[rgba(255,92,122,0.08)]"
                  >
                    Delete Room
                  </button>
                ) : null}
              </div>
            </div>
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
