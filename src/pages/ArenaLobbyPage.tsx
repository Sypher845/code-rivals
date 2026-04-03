import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Identity } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";
import coderivalsMark from "../assets/coderivals-mark.svg";
import { panelFrameClass, panelNoiseClass } from "../components/uiClasses";
import { reducers, tables } from "../module_bindings";
import { formatSessionTime } from "../utils/format";

type ArenaLobbyPageProps = {
  identity: Identity | undefined;
  isLoggingOut: boolean;
  onLogOut: () => void;
  shortIdentity: string;
  userSlug: string;
  username: string;
};

type StatusTone = "neutral" | "error";

function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase();
}

function getRoomFromQueryParam() {
  if (typeof window === "undefined") {
    return "";
  }

  const currentUrl = new URL(window.location.href);
  return normalizeRoomCode(currentUrl.searchParams.get("room") ?? "");
}

function setRoomQueryParam(roomId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  const currentUrl = new URL(window.location.href);
  if (roomId) {
    currentUrl.searchParams.set("room", roomId);
  } else {
    currentUrl.searchParams.delete("room");
  }

  window.history.replaceState(
    null,
    "",
    `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
  );
}

function buildShareUrl(roomId: string) {
  if (typeof window === "undefined") {
    return roomId;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("room", roomId);
  return currentUrl.toString();
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

export function ArenaLobbyPage({
  identity,
  isLoggingOut,
  onLogOut,
  shortIdentity,
  userSlug,
  username,
}: ArenaLobbyPageProps) {
  const [arenaStatusMessage, setArenaStatusMessage] = useState<string | null>(
    null,
  );
  const [arenaStatusTone, setArenaStatusTone] = useState<StatusTone>("neutral");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [processedRoomCode, setProcessedRoomCode] = useState<string | null>(
    null,
  );

  const createArenaRoom = useReducer(reducers.createArenaRoom);
  const joinArenaRoom = useReducer(reducers.joinArenaRoom);
  const startArenaMatch = useReducer(reducers.startArenaMatch);
  const kickArenaMember = useReducer(reducers.kickArenaMember);

  const [arenaRoomRows, arenaRoomsReady] = useTable(tables.arenaRoom);
  const [arenaMemberRows, arenaMembersReady] = useTable(tables.arenaRoomMember);

  const arenaReady = arenaRoomsReady && arenaMembersReady;

  const activeRoom = useMemo(() => {
    if (!activeRoomId) {
      return null;
    }
    return arenaRoomRows.find((room) => room.roomId === activeRoomId) ?? null;
  }, [activeRoomId, arenaRoomRows]);

  const activeRoomMembers = useMemo(() => {
    if (!activeRoom) {
      return [];
    }

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

  const actionButtonClass =
    "inline-flex min-h-12 items-center justify-center rounded-2xl border border-[rgba(224,141,255,0.35)] bg-[linear-gradient(90deg,rgba(73,46,88,0.98),rgba(15,48,95,0.98))] px-5 text-sm font-semibold tracking-[0.08em] text-[var(--on-background)] uppercase shadow-[0_14px_26px_rgba(0,0,0,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

  const inputClass =
    "min-h-[3.4rem] w-full rounded-2xl border border-[rgba(241,243,252,0.15)] bg-[rgba(8,14,20,0.85)] px-4 py-3 text-[var(--on-background)] placeholder:text-[rgba(241,243,252,0.45)] outline-none transition focus:border-[rgba(0,255,255,0.4)] focus:ring-2 focus:ring-[rgba(0,255,255,0.18)]";

  const pushArenaStatus = (
    message: string,
    tone: StatusTone = "neutral",
  ) => {
    setArenaStatusTone(tone);
    setArenaStatusMessage(message);
  };

  const openRoomByCode = async (
    incomingRoomCode: string,
    source: "input" | "url",
  ) => {
    if (!identity) {
      pushArenaStatus("Session identity is not ready yet.", "error");
      console.warn("[Arena] open blocked - missing identity");
      return;
    }

    if (!arenaReady) {
      pushArenaStatus("Syncing arena tables...", "error");
      return;
    }

    const normalizedRoomCode = normalizeRoomCode(incomingRoomCode);
    if (!normalizedRoomCode) {
      if (source === "input") {
        pushArenaStatus("Enter a room code to open an arena.", "error");
      }
      return;
    }

    const existingRoom = arenaRoomRows.find(
      (room) => room.roomId === normalizedRoomCode,
    );
    if (!existingRoom) {
      pushArenaStatus(`Room ${normalizedRoomCode} was not found.`, "error");
      return;
    }

    try {
      await joinArenaRoom({ roomId: normalizedRoomCode });
      setActiveRoomId(normalizedRoomCode);
      setRoomCodeInput(normalizedRoomCode);
      pushArenaStatus(`Connected to arena ${normalizedRoomCode}.`);
      setRoomQueryParam(normalizedRoomCode);
      console.info("[Arena] joined room", { roomId: normalizedRoomCode, source });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to join this room.";
      pushArenaStatus(message, "error");
      console.error("[Arena] failed joining room", error);
    }
  };

  const handleCreateArena = async () => {
    if (!identity) {
      pushArenaStatus("Session identity is not ready yet.", "error");
      return;
    }

    if (!arenaReady) {
      pushArenaStatus("Syncing arena tables...", "error");
      return;
    }

    const existingRoomIds = new Set(arenaRoomRows.map((room) => room.roomId));
    const roomId = generateRoomId(existingRoomIds);

    try {
      await createArenaRoom({ roomId });
      setActiveRoomId(roomId);
      setRoomCodeInput(roomId);
      pushArenaStatus(`Arena ${roomId} created. Share it with your rival.`);
      setRoomQueryParam(roomId);
      console.info("[Arena] room created", { roomId, creator: username });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create room.";
      pushArenaStatus(message, "error");
      console.error("[Arena] failed creating room", error);
    }
  };

  const handleCloseRoomCard = () => {
    if (!activeRoomId) {
      return;
    }

    setActiveRoomId(null);
    setRoomQueryParam(null);
    console.debug("[Arena] closed room modal", { roomId: activeRoomId });
  };

  const handleStartMatch = async () => {
    if (!activeRoom) {
      return;
    }

    try {
      await startArenaMatch({ roomId: activeRoom.roomId });
      pushArenaStatus(`Match started in room ${activeRoom.roomId}.`);
      console.info("[Arena] match started", { roomId: activeRoom.roomId });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start this match.";
      pushArenaStatus(message, "error");
      console.error("[Arena] failed starting match", error);
    }
  };

  const handleKickMember = async (memberId: bigint) => {
    if (!activeRoom) {
      return;
    }

    try {
      await kickArenaMember({ roomId: activeRoom.roomId, memberId });
      pushArenaStatus("User removed from room.");
      console.info("[Arena] member kicked", {
        roomId: activeRoom.roomId,
        memberId: memberId.toString(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to kick this user.";
      pushArenaStatus(message, "error");
      console.error("[Arena] failed kicking member", error);
    }
  };

  const handleShareRoom = async () => {
    if (!activeRoom) {
      return;
    }

    const shareUrl = buildShareUrl(activeRoom.roomId);

    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(shareUrl);
      pushArenaStatus("Room URL copied to clipboard.");
      console.info("[Arena] copied room url", {
        roomId: activeRoom.roomId,
        shareUrl,
      });
    } catch (error) {
      pushArenaStatus(`Clipboard unavailable. Share manually: ${shareUrl}`, "error");
      console.warn("[Arena] failed copying room url", error);
    }
  };

  useEffect(() => {
    console.debug("[Arena] table snapshot", {
      arenaReady,
      roomsReady: arenaRoomsReady,
      membersReady: arenaMembersReady,
      roomCount: arenaRoomRows.length,
      memberCount: arenaMemberRows.length,
      activeRoomId,
    });
  }, [
    activeRoomId,
    arenaMemberRows,
    arenaMembersReady,
    arenaReady,
    arenaRoomRows,
    arenaRoomsReady,
  ]);

  useEffect(() => {
    if (!identity || !arenaReady) {
      return;
    }

    const roomFromUrl = getRoomFromQueryParam();
    if (!roomFromUrl || roomFromUrl === processedRoomCode) {
      return;
    }

    setProcessedRoomCode(roomFromUrl);
    setRoomCodeInput(roomFromUrl);
    void openRoomByCode(roomFromUrl, "url");
  }, [arenaReady, arenaRoomRows, identity, processedRoomCode]);

  useEffect(() => {
    if (activeRoomId && !arenaRoomRows.some((room) => room.roomId === activeRoomId)) {
      setActiveRoomId(null);
      setRoomQueryParam(null);
    }
  }, [activeRoomId, arenaRoomRows]);

  return (
    <main className="min-h-full px-6 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 pb-6">
        <Link to="/" className="inline-flex items-center gap-3">
          <img
            src={coderivalsMark}
            alt="CodeRivals"
            className="h-10 w-10 rounded-xl"
          />
          <span className="font-[var(--font-mono)] text-xs tracking-[0.2em] text-[var(--on-background)] uppercase">
            Arena Control Deck
          </span>
        </Link>

        <div className="inline-flex items-center gap-3">
          <span className="hidden font-[var(--font-mono)] text-[0.68rem] tracking-[0.14em] text-[rgba(241,243,252,0.62)] uppercase sm:inline-block">
            Session {shortIdentity}
          </span>
          <button
            className="inline-flex min-h-10 items-center rounded-full border border-[rgba(224,141,255,0.35)] px-4 text-xs font-semibold tracking-[0.12em] text-[var(--on-background)] uppercase transition hover:bg-[rgba(224,141,255,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onLogOut}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging Out" : "Log Out"}
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className={`${panelFrameClass} p-6`}>
          <div className={panelNoiseClass} />
          <div className="relative z-[1] space-y-7">
            <div className="space-y-3">
              <p className="font-[var(--font-mono)] text-xs tracking-[0.3em] text-[var(--secondary)] uppercase">
                /user/{userSlug} Arena Lobby
              </p>
              <h1 className="max-w-[14ch] text-[clamp(2.2rem,5vw,3.9rem)] leading-[0.9] font-bold tracking-[-0.04em] uppercase">
                Create Or Join Your Duel Room.
              </h1>
              <p className="max-w-[56ch] text-sm leading-7 text-[rgba(241,243,252,0.74)] sm:text-base">
                Create a private room, open an existing room with code, then use
                the popup card for members, moderation, and match start.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.72)] p-4">
                <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase">
                  Pilot
                </p>
                <p className="mt-2 text-sm font-semibold">{username}</p>
              </article>
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.72)] p-4">
                <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase">
                  Active Room
                </p>
                <p className="mt-2 text-sm font-semibold">{activeRoom?.roomId ?? "NONE"}</p>
              </article>
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.72)] p-4">
                <p className="font-[var(--font-mono)] text-[0.65rem] tracking-[0.18em] text-[rgba(241,243,252,0.58)] uppercase">
                  Rooms Live
                </p>
                <p className="mt-2 text-sm font-semibold">{arenaRoomRows.length}</p>
              </article>
            </div>

            <div className="grid gap-4">
              <button
                className={actionButtonClass}
                type="button"
                onClick={() => {
                  void handleCreateArena();
                }}
                disabled={!arenaReady}
              >
                {!arenaReady ? "Syncing Tables" : "Create Arena"}
              </button>

              <div className="grid gap-3">
                <label className="font-[var(--font-mono)] text-[0.72rem] tracking-[0.22em] text-[rgba(241,243,252,0.62)] uppercase">
                  Room Code
                </label>
                <input
                  className={inputClass}
                  type="text"
                  value={roomCodeInput}
                  onChange={(event) => setRoomCodeInput(event.target.value)}
                  autoComplete="off"
                  placeholder="ENTER 6-CHAR ROOM CODE"
                  disabled={!arenaReady}
                />
                <button
                  className={actionButtonClass}
                  type="button"
                  onClick={() => {
                    void openRoomByCode(roomCodeInput, "input");
                  }}
                  disabled={!arenaReady}
                >
                  Open Room Card
                </button>
              </div>
            </div>

            <div
              className={
                arenaStatusTone === "error"
                  ? "rounded-2xl border border-[rgba(224,141,255,0.25)] bg-[rgba(45,22,41,0.72)] px-4 py-3 text-sm text-[var(--on-background)]"
                  : "rounded-2xl border border-[rgba(224,141,255,0.18)] bg-[rgba(29,18,39,0.48)] px-4 py-3 text-sm text-[rgba(241,243,252,0.78)]"
              }
            >
              {arenaStatusMessage ??
                (!arenaReady
                  ? "Syncing arena tables..."
                  : "Create a room or enter a room code to open the room card.")}
            </div>
          </div>
        </section>

        <section className={`${panelFrameClass} p-6`}>
          <div className={panelNoiseClass} />
          <div className="relative z-[1] space-y-4">
            <p className="font-[var(--font-mono)] text-[0.72rem] tracking-[0.24em] text-[var(--primary)] uppercase">
              Active Rooms
            </p>

            <div className="space-y-3">
              {arenaRoomRows.length === 0 && (
                <p className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.72)] px-4 py-3 text-sm text-[rgba(241,243,252,0.7)]">
                  No rooms yet. Create your first arena from the left panel.
                </p>
              )}

              {arenaRoomRows.map((room) => {
                const memberCount = arenaMemberRows.filter(
                  (member) => member.roomId === room.roomId,
                ).length;

                return (
                  <button
                    key={room.roomId}
                    type="button"
                    onClick={() => {
                      void openRoomByCode(room.roomId, "input");
                    }}
                    className="w-full rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.74)] px-4 py-3 text-left transition hover:border-[rgba(0,255,255,0.35)]"
                  >
                    <p className="font-[var(--font-mono)] text-xs tracking-[0.14em] text-[var(--secondary)] uppercase">
                      Room {room.roomId}
                    </p>
                    <p className="mt-2 text-sm text-[rgba(241,243,252,0.8)]">
                      Creator {room.creatorName}
                    </p>
                    <p className="mt-1 text-xs text-[rgba(241,243,252,0.62)]">
                      Members {memberCount} • Status {room.matchState.toUpperCase()}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {activeRoom && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-[rgba(2,8,13,0.68)] p-4 backdrop-blur-sm">
          <section className={`${panelFrameClass} flex w-full max-w-3xl flex-col gap-4 p-5`}>
            <div className={panelNoiseClass} />

            <header className="relative z-[1] flex items-start justify-between gap-4">
              <div>
                <p className="font-[var(--font-mono)] text-[0.72rem] tracking-[0.24em] text-[var(--secondary)] uppercase">
                  Arena Room Card
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em]">
                  Room {activeRoom.roomId}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-[rgba(241,243,252,0.22)] px-4 py-2 text-xs font-semibold tracking-[0.1em] uppercase transition hover:border-[rgba(0,255,255,0.35)]"
                onClick={handleCloseRoomCard}
              >
                Close
              </button>
            </header>

            <div className="relative z-[1] grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.78)] p-3">
                <p className="font-[var(--font-mono)] text-[0.62rem] tracking-[0.16em] text-[rgba(241,243,252,0.58)] uppercase">
                  Room ID
                </p>
                <p className="mt-2 text-sm font-semibold">{activeRoom.roomId}</p>
              </article>
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.78)] p-3">
                <p className="font-[var(--font-mono)] text-[0.62rem] tracking-[0.16em] text-[rgba(241,243,252,0.58)] uppercase">
                  Creator
                </p>
                <p className="mt-2 text-sm font-semibold">{activeRoom.creatorName}</p>
              </article>
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.78)] p-3">
                <p className="font-[var(--font-mono)] text-[0.62rem] tracking-[0.16em] text-[rgba(241,243,252,0.58)] uppercase">
                  Match
                </p>
                <p className="mt-2 text-sm font-semibold">{activeRoom.matchState.toUpperCase()}</p>
              </article>
            </div>

            <section className="relative z-[1] rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.78)] p-4">
              <p className="font-[var(--font-mono)] text-[0.68rem] tracking-[0.18em] text-[rgba(241,243,252,0.62)] uppercase">
                Joined Users ({activeRoomMembers.length})
              </p>

              <ul className="mt-3 space-y-2">
                {activeRoomMembers.map((member) => (
                  <li
                    key={member.memberId.toString()}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(241,243,252,0.1)] bg-[rgba(4,10,16,0.86)] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold">{member.memberName}</p>
                      <p className="text-xs text-[rgba(241,243,252,0.6)]">
                        Joined {formatSessionTime(member.joinedAt.toDate())}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {member.memberIdentity.isEqual(activeRoom.creatorIdentity) && (
                        <span className="rounded-full border border-[rgba(224,141,255,0.34)] px-2 py-1 font-[var(--font-mono)] text-[0.62rem] tracking-[0.08em] uppercase">
                          ADMIN
                        </span>
                      )}
                      {identity && member.memberIdentity.isEqual(identity) && (
                        <span className="rounded-full border border-[rgba(0,255,255,0.34)] px-2 py-1 font-[var(--font-mono)] text-[0.62rem] tracking-[0.08em] text-[var(--secondary)] uppercase">
                          YOU
                        </span>
                      )}
                      {isArenaAdmin &&
                        !member.memberIdentity.isEqual(activeRoom.creatorIdentity) && (
                          <button
                            type="button"
                            className="rounded-lg border border-[rgba(224,141,255,0.35)] bg-[rgba(45,22,41,0.72)] px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.08em] uppercase"
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

            <div className="relative z-[1] space-y-3">
              <button
                type="button"
                className={actionButtonClass}
                onClick={() => {
                  void handleStartMatch();
                }}
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

            <button
              type="button"
              className="relative z-[1] mx-auto inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(0,255,255,0.34)] px-7 text-xs font-semibold tracking-[0.12em] text-[var(--secondary)] uppercase transition hover:bg-[rgba(0,255,255,0.1)]"
              onClick={() => {
                void handleShareRoom();
              }}
            >
              Share Room URL
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
