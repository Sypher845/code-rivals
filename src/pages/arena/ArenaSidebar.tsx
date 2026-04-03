import { useState, useMemo } from "react";
import type { Identity } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";
import { reducers, tables } from "../../module_bindings";
import {
  panelFrameClass,
  panelNoiseClass,
  arenaActionClass,
  arenaInputClass,
} from "../../components/uiClasses";

type ArenaSidebarProps = {
  identity: Identity | undefined;
  arenaReady: boolean;
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

export function ArenaSidebar({ identity, arenaReady }: ArenaSidebarProps) {
  const [arenaMode, setArenaMode] = useState<"create" | "join">("create");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"neutral" | "error">("neutral");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");

  const createArenaRoom = useReducer(reducers.createArenaRoom);
  const joinArenaRoom = useReducer(reducers.joinArenaRoom);
  const startArenaMatch = useReducer(reducers.startArenaMatch);
  const kickArenaMember = useReducer(reducers.kickArenaMember);

  const [arenaRoomRows] = useTable(tables.arenaRoom);
  const [arenaMemberRows] = useTable(tables.arenaRoomMember);

  const activeRoom = useMemo(() => {
    if (!activeRoomId) return null;
    return arenaRoomRows.find((room) => room.roomId === activeRoomId) ?? null;
  }, [activeRoomId, arenaRoomRows]);

  const activeRoomMembers = useMemo(() => {
    if (!activeRoom) return [];
    return arenaMemberRows
      .filter((member) => member.roomId === activeRoom.roomId)
      .sort((left, right) => {
        if (left.joinedAt.microsSinceUnixEpoch < right.joinedAt.microsSinceUnixEpoch) return -1;
        if (left.joinedAt.microsSinceUnixEpoch > right.joinedAt.microsSinceUnixEpoch) return 1;
        return 0;
      });
  }, [activeRoom, arenaMemberRows]);

  const isArenaAdmin = Boolean(
    activeRoom && identity && activeRoom.creatorIdentity.isEqual(identity),
  );
  const isLobbyReady = Boolean(activeRoom && activeRoomMembers.length >= 2);

  const pushStatus = (message: string, tone: "neutral" | "error" = "neutral") => {
    setStatusTone(tone);
    setStatusMessage(message);
  };

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

  const handleShareRoom = async () => {
    if (!activeRoom) return;
    const shareUrl = `${window.location.origin}?room=${activeRoom.roomId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      pushStatus("Room URL copied to clipboard.");
    } catch {
      pushStatus(`Clipboard unavailable. Share manually: ${shareUrl}`, "error");
    }
  };

  return (
    <aside className={`${panelFrameClass} min-h-[46rem] border-l-2 border-l-(--arena-accent) bg-(--arena-surface-2) p-6`}>
        <div className={panelNoiseClass} />
      <div className="relative z-1 space-y-5">
          <div>
            <p className="font-(--font-mono) text-[0.72rem] tracking-[0.24em] text-(--primary) uppercase">
              Quick Arena
            </p>
          </div>

          <div className="inline-flex w-full rounded-lg border border-[rgba(241,243,252,0.12)] bg-[rgba(6,11,18,0.72)] p-1">
            <button
              type="button"
              onClick={() => setArenaMode("create")}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold tracking-[0.1em] uppercase transition ${
                arenaMode === "create"
                  ? "border border-[rgba(0,229,204,0.55)] bg-[rgba(0,229,204,0.15)] text-(--on-background)"
                  : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
              }`}
            >
              Create Arena
            </button>
            <button
              type="button"
              onClick={() => setArenaMode("join")}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold tracking-[0.1em] uppercase transition ${
                arenaMode === "join"
                  ? "border border-[rgba(0,255,255,0.32)] bg-[rgba(0,255,255,0.1)] text-(--on-background)"
                  : "text-[rgba(241,243,252,0.62)] hover:text-(--on-background)"
              }`}
            >
              Join Arena
            </button>
          </div>

          {arenaMode === "create" ? (
            <div className="space-y-3">
              <button
                className={arenaActionClass}
                type="button"
                onClick={handleCreateArena}
                disabled={!arenaReady}
              >
                {!arenaReady ? "Syncing Tables" : "Create Arena"}
              </button>

              {activeRoom && (
                <section className="space-y-4 rounded-lg border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.74)] p-4">
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-(--font-mono) text-[0.65rem] tracking-[0.18em] text-(--secondary) uppercase">
                        Arena Room Card
                      </p>
                      <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                        Room {activeRoom.roomId}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-[rgba(241,243,252,0.22)] px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.1em] uppercase transition hover:border-[rgba(0,255,255,0.35)]"
                      onClick={() => setActiveRoomId(null)}
                    >
                      Close
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
                      <p className="mt-1 text-xs font-semibold">{activeRoom.matchState.toUpperCase()}</p>
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

                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[rgba(0,255,255,0.34)] px-5 text-[0.68rem] font-semibold tracking-[0.12em] text-(--secondary) uppercase transition hover:bg-[rgba(0,255,255,0.1)]"
                    onClick={handleShareRoom}
                  >
                    Share Room URL
                  </button>
                </section>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="font-(--font-mono) text-[0.72rem] tracking-[0.22em] text-[rgba(241,243,252,0.62)] uppercase">
                Room Code
              </label>
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

          <div className="pt-2">
            <p className="font-(--font-mono) text-[0.72rem] tracking-[0.24em] text-(--secondary) uppercase">
              Active Rooms ({arenaRoomRows.length})
            </p>

            <div className="mt-3 space-y-2">
              {arenaRoomRows.length === 0 && (
                <p className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.72)] px-4 py-3 text-sm text-[rgba(241,243,252,0.7)]">
                  No rooms yet. Create your first arena above.
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
                      setRoomCodeInput(room.roomId);
                      setActiveRoomId(room.roomId);
                      setArenaMode("create");
                    }}
                    className="w-full rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(8,14,20,0.74)] px-4 py-3 text-left transition hover:border-[rgba(0,255,255,0.35)]"
                  >
                    <p className="font-(--font-mono) text-xs tracking-[0.14em] text-(--secondary) uppercase">
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
        </div>
      </aside>
  );
}
