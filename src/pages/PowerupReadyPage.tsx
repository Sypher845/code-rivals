import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Identity } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { panelFrameClass, panelNoiseClass } from "../components/uiClasses";
import { reducers, tables } from "../module_bindings";
import { POWER_CARD_REGISTRY } from "./powerups/powerupRegistry";

type PowerupReadyPageProps = {
  identity: Identity | undefined;
  username: string;
};

const COUNTDOWN_SECONDS = 5;

function formatCountdownLabel(secondsLeft: number) {
  return secondsLeft > 0 ? secondsLeft.toString() : "GO";
}

export function PowerupReadyPage({
  identity,
  username,
}: PowerupReadyPageProps) {
  const navigate = useNavigate();
  const { roomSegment, roundSegment } = useParams();
  const normalizedRoomId = roomSegment?.replace(/^room=/i, "").trim().toUpperCase() ?? null;
  const normalizedRoundNumber = roundSegment?.replace(/^r/i, "") ?? "1";
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const hasNavigatedRef = useRef(false);

  const [arenaRoomRows, arenaRoomsReady] = useTable(tables.arenaRoom);
  const [arenaMemberRows] = useTable(tables.arenaRoomMember);
  const [arenaPowerupLockRows] = useTable(tables.arenaPowerupLock);

  const beginPlayingRound = useReducer(reducers.beginPlayingRound);
  const unlockArenaPowerup = useReducer(reducers.unlockArenaPowerup);

  const activeRoom = useMemo(() => {
    if (!normalizedRoomId) return null;
    return arenaRoomRows.find((room) => room.roomId === normalizedRoomId) ?? null;
  }, [arenaRoomRows, normalizedRoomId]);

  const roomMembers = useMemo(() => {
    if (!normalizedRoomId) return [];
    return arenaMemberRows.filter((member) => member.roomId === normalizedRoomId);
  }, [arenaMemberRows, normalizedRoomId]);

  const roomLocks = useMemo(() => {
    if (!normalizedRoomId) return [];
    return arenaPowerupLockRows.filter((lock) => lock.roomId === normalizedRoomId);
  }, [arenaPowerupLockRows, normalizedRoomId]);

  const playerOneIdentity = activeRoom?.draftPlayerOneIdentity ?? undefined;
  const playerTwoIdentity = activeRoom?.draftPlayerTwoIdentity ?? undefined;

  const isPlayerOne = Boolean(identity && playerOneIdentity?.isEqual(identity));
  const isPlayerTwo = Boolean(identity && playerTwoIdentity?.isEqual(identity));
  const isAssignedPlayer = isPlayerOne || isPlayerTwo;

  const myLock = useMemo(() => {
    if (!identity) return null;
    return roomLocks.find((lock) => lock.playerIdentity.isEqual(identity)) ?? null;
  }, [identity, roomLocks]);

  const opponentLock = useMemo(() => {
    if (!identity) return null;
    return roomLocks.find((lock) => !lock.playerIdentity.isEqual(identity)) ?? null;
  }, [identity, roomLocks]);

  const opponentMember = useMemo(() => {
    if (!identity) return null;
    return roomMembers.find((member) => !member.memberIdentity.isEqual(identity)) ?? null;
  }, [identity, roomMembers]);

  const myPowerupDescriptor = myLock?.powerupId
    ? POWER_CARD_REGISTRY[myLock.powerupId]
    : null;
  const countdownAnchorMicros = activeRoom?.roundStartTime?.microsSinceUnixEpoch ?? null;

  const countdownDeadlineMs = countdownAnchorMicros
    ? Number((countdownAnchorMicros + BigInt(COUNTDOWN_SECONDS) * 1_000_000n) / 1000n)
    : null;
  const secondsLeft = countdownDeadlineMs
    ? Math.max(0, Math.ceil((countdownDeadlineMs - nowMs) / 1000))
    : null;
  const bothPlayersLocked = Boolean(myLock?.hasLockedPower && opponentLock?.hasLockedPower);

  useEffect(() => {
    if (!bothPlayersLocked) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [bothPlayersLocked]);

  useEffect(() => {
    if (!bothPlayersLocked || secondsLeft !== 0 || !normalizedRoomId || hasNavigatedRef.current) {
      return;
    }

    hasNavigatedRef.current = true;
    void beginPlayingRound({ roomId: normalizedRoomId });
  }, [
    beginPlayingRound,
    bothPlayersLocked,
    normalizedRoomId,
    secondsLeft,
  ]);

  useEffect(() => {
    if (!normalizedRoomId || !activeRoom) {
      return;
    }

    if (activeRoom.matchState !== "playing") {
      return;
    }

    const params = new URLSearchParams({ room: normalizedRoomId });
    const round = activeRoom.currentRound?.toString() ?? normalizedRoundNumber;
    navigate(`/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${round}`, {
      replace: true,
    });
  }, [activeRoom, navigate, normalizedRoomId, normalizedRoundNumber, username]);

  const missingRoomMessage = !normalizedRoomId
    ? "Open this screen from an active room to wait for lock-in."
    : !arenaRoomsReady
      ? "Loading room state..."
      : !activeRoom
        ? `Room ${normalizedRoomId} was not found.`
        : activeRoom.matchState !== "round_intro" && activeRoom.matchState !== "drafting"
          ? "This room is not in the round intro countdown yet."
          : !isAssignedPlayer
            ? "Only assigned players can wait on this screen."
            : null;

  const handleUnlock = async () => {
    if (!normalizedRoomId) return;

    try {
      await unlockArenaPowerup({ roomId: normalizedRoomId });
      navigate(`/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${normalizedRoundNumber}/power-cards`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to unlock your powerup.",
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--arena-page-bg) px-4 py-8 text-(--on-background) sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_16%,rgba(0,255,255,0.11),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(224,141,255,0.12),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(0,153,255,0.08),transparent_30%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-(--font-mono) text-[0.66rem] tracking-[0.24em] text-(--secondary) uppercase">
              Arena Lock-In
            </p>
            <h1 className="mt-2 font-(--font-heading) text-4xl leading-none tracking-[0.08em] uppercase sm:text-6xl">
              Await Rival Confirmation
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[rgba(241,243,252,0.68)] sm:text-base">
              Your powerup is locked. Once both players confirm, the arena fires a shared five-second launch countdown.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[rgba(241,243,252,0.74)]">
            <span className="rounded-full border border-[rgba(241,243,252,0.16)] px-3 py-1.5 font-(--font-mono) tracking-[0.08em] uppercase">
              User {username}
            </span>
            {normalizedRoomId && (
              <span className="rounded-full border border-[rgba(0,255,255,0.24)] px-3 py-1.5 font-(--font-mono) tracking-[0.08em] text-(--secondary) uppercase">
                Room {normalizedRoomId}
              </span>
            )}
          </div>
        </header>

        {missingRoomMessage ? (
          <section className={`${panelFrameClass} rounded-2xl border border-[rgba(241,243,252,0.18)] p-6`}>
            <p className="text-sm text-[rgba(241,243,252,0.82)]">{missingRoomMessage}</p>
          </section>
        ) : (
          <>
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:items-stretch">
              <article className={`${panelFrameClass} min-h-[28rem] rounded-[2rem] border-[rgba(0,255,255,0.18)] p-5 sm:p-7`}>
                <div className={panelNoiseClass} />
                <div className="relative z-1 flex h-full flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-(--font-mono) text-[0.62rem] tracking-[0.22em] text-[rgba(241,243,252,0.48)] uppercase">
                        Locked Loadout
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                        {myLock?.powerupId ?? "No Powerup Locked"}
                      </h2>
                    </div>
                    <div className="rounded-full border border-[rgba(0,255,255,0.28)] bg-[rgba(0,255,255,0.08)] px-3 py-1.5 font-(--font-mono) text-[0.68rem] tracking-[0.12em] text-(--secondary) uppercase">
                      {bothPlayersLocked ? "Countdown Armed" : "Waiting"}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-1 items-center justify-center">
                    {myLock && myPowerupDescriptor ? (
                      <div className="relative flex flex-col items-center gap-5">
                        <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle,rgba(0,255,255,0.18),transparent_68%)] blur-3xl" />
                        <div className={`${panelFrameClass} relative rounded-[2rem] border-[rgba(233,242,255,0.56)] bg-[rgba(8,22,30,0.92)] p-5`}>
                          <myPowerupDescriptor.Card size={360} />
                        </div>
                        <p className="max-w-xl text-center text-sm leading-relaxed text-[rgba(241,243,252,0.68)] sm:text-base">
                          {myPowerupDescriptor.description}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[rgba(241,243,252,0.16)] px-8 py-10 text-center text-sm text-[rgba(241,243,252,0.58)]">
                        Waiting for your lock selection to sync.
                      </div>
                    )}
                  </div>
                </div>
              </article>

              <aside className="flex h-full flex-col gap-5">
                <section className={`${panelFrameClass} flex-1 rounded-[1.75rem] p-5`}>
                  <div className={panelNoiseClass} />
                  <div className="relative z-1 flex h-full flex-col">
                    <p className="font-(--font-mono) text-[0.62rem] tracking-[0.22em] text-[rgba(241,243,252,0.5)] uppercase">
                      Ready Check
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-[rgba(241,243,252,0.1)] bg-[rgba(5,12,18,0.84)] p-4">
                        <p className="text-xs tracking-[0.14em] text-[rgba(241,243,252,0.5)] uppercase">
                          You
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">{username}</p>
                          <span className="rounded-full border border-[rgba(0,255,255,0.28)] px-2.5 py-1 text-[0.62rem] font-semibold tracking-[0.08em] text-(--secondary) uppercase">
                            {myLock?.hasLockedPower ? "Locked" : "Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[rgba(241,243,252,0.1)] bg-[rgba(5,12,18,0.84)] p-4">
                        <p className="text-xs tracking-[0.14em] text-[rgba(241,243,252,0.5)] uppercase">
                          Rival
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">{opponentMember?.memberName ?? "Connecting..."}</p>
                          <span className="rounded-full border border-[rgba(224,141,255,0.3)] px-2.5 py-1 text-[0.62rem] font-semibold tracking-[0.08em] uppercase">
                            {opponentLock?.hasLockedPower ? "Locked" : "Waiting"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-[rgba(241,243,252,0.1)] bg-[linear-gradient(180deg,rgba(16,24,36,0.92),rgba(7,12,20,0.9))] p-4">
                      <p className="font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-[rgba(241,243,252,0.52)] uppercase">
                        Launch State
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                        {bothPlayersLocked
                          ? `${secondsLeft ?? COUNTDOWN_SECONDS}s to deploy`
                          : "Awaiting final lock"}
                      </p>
                      <p className="mt-2 text-sm text-[rgba(241,243,252,0.62)]">
                        {bothPlayersLocked
                          ? "Countdown has started for both players."
                          : "The countdown popup appears immediately after the rival confirms."}
                      </p>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[rgba(241,243,252,0.16)] bg-[rgba(12,18,27,0.85)] px-5 font-(--font-mono) text-xs tracking-[0.16em] uppercase transition hover:border-[rgba(241,243,252,0.32)] disabled:cursor-not-allowed disabled:opacity-55"
                    onClick={() => {
                      void handleUnlock();
                    }}
                    disabled={bothPlayersLocked}
                  >
                    Unlock & Return
                  </button>
                  <Link
                    to={`/${encodeURIComponent(username)}`}
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[rgba(0,255,255,0.24)] px-5 font-(--font-mono) text-xs tracking-[0.16em] text-(--secondary) uppercase transition hover:bg-[rgba(0,255,255,0.08)]"
                  >
                    Exit to Arena
                  </Link>
                </div>

                {statusMessage && (
                  <p className="text-sm text-[rgba(255,184,201,0.88)]">{statusMessage}</p>
                )}
              </aside>
            </section>

            <AnimatePresence>
              {bothPlayersLocked && (
                <motion.div
                  className="fixed inset-0 z-40 grid place-items-center bg-[rgba(2,8,13,0.72)] p-4 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.section
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 24 }}
                    className={`${panelFrameClass} relative w-full max-w-xl rounded-[2rem] border-[rgba(0,255,255,0.24)] bg-[linear-gradient(145deg,rgba(8,18,28,0.96),rgba(14,11,29,0.96))] p-7 text-center`}
                  >
                    <div className={panelNoiseClass} />
                    <div className="relative z-1">
                      <p className="font-(--font-mono) text-[0.68rem] tracking-[0.24em] text-(--secondary) uppercase">
                        Both Players Locked In
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                        Arena Launch Countdown
                      </h2>
                      <div className="mt-6 flex justify-center">
                        <div className="grid h-34 w-34 place-items-center rounded-full border border-[rgba(0,255,255,0.24)] bg-[radial-gradient(circle,rgba(0,255,255,0.18),rgba(10,16,29,0.98)_65%)] font-(--font-heading) text-6xl">
                          {formatCountdownLabel(secondsLeft ?? COUNTDOWN_SECONDS)}
                        </div>
                      </div>
                      <p className="mt-5 text-sm leading-relaxed text-[rgba(241,243,252,0.68)]">
                        Hold position. Match interface will open automatically when the timer hits zero.
                      </p>
                    </div>
                  </motion.section>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
