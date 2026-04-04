import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Identity } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { panelFrameClass } from "../components/uiClasses";
import { reducers, tables } from "../module_bindings";
import {
  POWER_CARD_REGISTRY,
  type PowerupDescriptor,
} from "./powerups/powerupRegistry";

type PowerupSelectionPageProps = {
  identity: Identity | undefined;
  username: string;
};

function mod(index: number, total: number) {
  if (total === 0) return 0;
  return ((index % total) + total) % total;
}

export function PowerupSelectionPage({
  identity,
  username,
}: PowerupSelectionPageProps) {
  const navigate = useNavigate();
  const { roomSegment, roundSegment } = useParams();
  const normalizedRoomId = roomSegment?.replace(/^room=/i, "").trim().toUpperCase() ?? null;
  const normalizedRoundNumber = roundSegment?.replace(/^r/i, "") ?? "1";

  const [arenaRoomRows, arenaRoomsReady] = useTable(tables.arenaRoom);
  const [arenaPowerupLockRows] = useTable(tables.arenaPowerupLock);
  const lockArenaPowerup = useReducer(reducers.lockArenaPowerup);
  const unlockArenaPowerup = useReducer(reducers.unlockArenaPowerup);

  const activeRoom = useMemo(() => {
    if (!normalizedRoomId) return null;
    return arenaRoomRows.find((room) => room.roomId === normalizedRoomId) ?? null;
  }, [arenaRoomRows, normalizedRoomId]);

  const roomPowerCardNames = useMemo(() => {
    if (!identity || !activeRoom) return [];

    const isPlayerOne = activeRoom.draftPlayerOneIdentity?.isEqual(identity) ?? false;
    const isPlayerTwo = activeRoom.draftPlayerTwoIdentity?.isEqual(identity) ?? false;

    if (!isPlayerOne && !isPlayerTwo) {
      return [];
    }

    return activeRoom.rolledPowers.slice(0, 3);
  }, [activeRoom, identity]);

  const powerups = useMemo<PowerupDescriptor[]>(() => {
    return roomPowerCardNames
      .map((cardName) => {
        const descriptor = POWER_CARD_REGISTRY[cardName];
        if (!descriptor) {
          return null;
        }

        return {
          id: cardName,
          ...descriptor,
        };
      })
      .filter((descriptor): descriptor is PowerupDescriptor => descriptor !== null);
  }, [roomPowerCardNames]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right
  const [lockedPowerupId, setLockedPowerupId] = useState<string | null>(null);
  const [lockStatusMessage, setLockStatusMessage] = useState<string | null>(null);
  const [lockSubmitting, setLockSubmitting] = useState(false);

  useEffect(() => {
    setLockedPowerupId(null);
    setActiveIndex((currentIndex) => mod(currentIndex, powerups.length));
  }, [powerups.length]);

  const activePowerup = powerups[activeIndex] ?? null;
  const currentLock = useMemo(() => {
    if (!identity || !normalizedRoomId) return null;
    return (
      arenaPowerupLockRows.find(
        (lock) =>
          lock.roomId === normalizedRoomId && lock.playerIdentity.isEqual(identity),
      ) ?? null
    );
  }, [arenaPowerupLockRows, identity, normalizedRoomId]);
  const isLocked = lockedPowerupId !== null;
  const isDraftingRound = activeRoom?.matchState === "drafting";

  useEffect(() => {
    const lockedId = currentLock?.powerupId ?? null;
    setLockedPowerupId(lockedId);

    if (!lockedId) {
      return;
    }

    const lockedIndex = powerups.findIndex((powerup) => powerup.id === lockedId);
    if (lockedIndex >= 0) {
      setActiveIndex(lockedIndex);
    }
  }, [currentLock?.powerupId, powerups]);

  useEffect(() => {
    if (!normalizedRoomId || !currentLock?.hasLockedPower || !currentLock.powerupId) {
      return;
    }

    setLockSubmitting(false);
    navigate(
      `/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${normalizedRoundNumber}/power-cards-locked`,
      { replace: true },
    );
  }, [
    currentLock?.hasLockedPower,
    currentLock?.powerupId,
    navigate,
    normalizedRoomId,
    normalizedRoundNumber,
    username,
  ]);

  useEffect(() => {
    if (!lockSubmitting) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLockSubmitting(false);
      setLockStatusMessage(
        "Lock sync is taking longer than expected. If it still does not move, refresh and make sure the SpacetimeDB module is published.",
      );
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [lockSubmitting]);

  const toggleLockSelection = async () => {
    if (!normalizedRoomId) {
      setLockStatusMessage("Room context is missing.");
      return;
    }

    if (!activePowerup && !isLocked) {
      return;
    }

    setLockSubmitting(true);
    setLockStatusMessage(null);

    try {
      if (isLocked) {
        await unlockArenaPowerup({ roomId: normalizedRoomId });
        setLockedPowerupId(null);
        setLockStatusMessage("Selection unlocked. Pick a different powerup.");
        return;
      }

      if (!activePowerup) {
        return;
      }

      await lockArenaPowerup({
        roomId: normalizedRoomId,
        powerupId: activePowerup.id,
      });
      setLockedPowerupId(activePowerup.id);
      navigate(
        `/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${normalizedRoundNumber}/power-cards-locked`,
      );
    } catch (error) {
      setLockStatusMessage(
        error instanceof Error ? error.message : "Unable to update powerup lock.",
      );
    } finally {
      setLockSubmitting(false);
    }
  };

  const cycle = useCallback((delta: number) => {
    if (isLocked || powerups.length === 0) return;
    setDirection(delta);
    setActiveIndex((current) => mod(current + delta, powerups.length));
  }, [isLocked, powerups.length]);

  const selectIndex = useCallback((index: number) => {
    if (isLocked || powerups.length === 0) return;
    const wrappedIndex = mod(index, powerups.length);
    const delta = wrappedIndex - activeIndex;
    setDirection(delta >= 0 ? 1 : -1);
    setActiveIndex(wrappedIndex);
  }, [isLocked, powerups.length, activeIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "NumpadEnter") {
        event.preventDefault();
        void toggleLockSelection();
        return;
      }

      if (isLocked || powerups.length === 0) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        cycle(1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        cycle(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePowerup?.id, isLocked, powerups.length, cycle]);

  useEffect(() => {
    if (!normalizedRoomId || !activeRoom) {
      return;
    }

    if (activeRoom.matchState === "round_intro") {
      const round = activeRoom.currentRound?.toString() ?? normalizedRoundNumber;
      navigate(
        `/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${round}/power-cards-locked`,
        { replace: true },
      );
      return;
    }

    if (activeRoom.matchState === "playing") {
      const round = activeRoom.currentRound?.toString() ?? normalizedRoundNumber;
      navigate(
        `/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${round}`,
        { replace: true },
      );
    }
  }, [activeRoom, navigate, normalizedRoomId, normalizedRoundNumber, username]);

  const missingRoomMessage = !normalizedRoomId
    ? "Open this screen from an active room to load your draft cards."
    : !arenaRoomsReady
      ? "Loading room data..."
      : !activeRoom
        ? `Room ${normalizedRoomId} was not found.`
        : !isDraftingRound
          ? "This round is not currently in the drafting phase."
          : powerups.length === 0
            ? "Your cards are not assigned yet. Wait for match start or verify room membership."
            : null;

  /* ── carousel layout helpers ── */
  const getVisibleCards = () => {
    if (powerups.length === 0) return [];
    const total = powerups.length;
    const positions: Array<{ powerup: PowerupDescriptor; index: number; offset: number }> = [];

    // Show up to 2 cards on each side for a 5-card view, or fewer if not enough cards
    const range = Math.min(Math.floor(total / 2), 2);

    for (let delta = -range; delta <= range; delta++) {
      const idx = mod(activeIndex + delta, total);
      // Avoid duplicates when total is small
      if (positions.find((p) => p.index === idx)) continue;
      positions.push({
        powerup: powerups[idx],
        index: idx,
        offset: delta,
      });
    }

    return positions;
  };

  const visibleCards = getVisibleCards();

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--arena-page-bg) px-4 py-8 text-(--on-background) sm:px-8">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-(--font-mono) text-[0.64rem] tracking-[0.2em] text-(--secondary) uppercase">
              Arena Power Draft
            </p>
            <h1 className="mt-1 font-(--font-heading) text-4xl leading-none tracking-[0.08em] text-(--on-background) uppercase sm:text-6xl">
              Choose Your Power
            </h1>
            <p className="mt-3 max-w-xl text-sm text-[rgba(241,243,252,0.72)] sm:text-base">
              Both players see the same three cards and lock one before the shared launch countdown begins.
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
          <section className="relative mt-6 sm:mt-8">
            {/* Carousel container */}
            <div className="relative flex min-h-[24.5rem] items-center justify-center sm:min-h-[32rem]">
              {/* Edge fades */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-16 bg-gradient-to-r from-[var(--arena-page-bg,#070b12)] to-transparent sm:w-24" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-16 bg-gradient-to-l from-[var(--arena-page-bg,#070b12)] to-transparent sm:w-24" />

              {/* Left arrow */}
              <button
                type="button"
                onClick={() => cycle(-1)}
                disabled={isLocked}
                className="absolute left-2 z-40 grid h-12 w-12 place-items-center rounded-full border border-[rgba(241,243,252,0.15)] bg-[rgba(10,14,20,0.7)] text-[var(--on-background)] backdrop-blur-sm transition hover:border-[rgba(224,141,255,0.4)] hover:bg-[rgba(224,141,255,0.1)] hover:text-[var(--primary)] disabled:opacity-30 sm:left-6 sm:h-14 sm:w-14"
                aria-label="Previous card"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4l-6 6 6 6" />
                </svg>
              </button>

              {/* Right arrow */}
              <button
                type="button"
                onClick={() => cycle(1)}
                disabled={isLocked}
                className="absolute right-2 z-40 grid h-12 w-12 place-items-center rounded-full border border-[rgba(241,243,252,0.15)] bg-[rgba(10,14,20,0.7)] text-[var(--on-background)] backdrop-blur-sm transition hover:border-[rgba(224,141,255,0.4)] hover:bg-[rgba(224,141,255,0.1)] hover:text-[var(--primary)] disabled:opacity-30 sm:right-6 sm:h-14 sm:w-14"
                aria-label="Next card"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 4l6 6-6 6" />
                </svg>
              </button>

              {/* Cards */}
              <div className="relative flex h-[24.5rem] w-full items-center justify-center sm:h-[32rem]">
                {visibleCards.map(({ powerup, index, offset }) => {
                  const active = offset === 0;
                  const lockedCard = lockedPowerupId === powerup.id;
                  const CardComponent = powerup.Card;

                  // spacing per slot
                  const slotWidth = 320; // px between card centers
                  const xOffset = offset * slotWidth;
                  const scale = active ? 1 : 0.75;
                  const opacity = active ? 1 : 0.35;
                  const zIndex = active ? 20 : 10 - Math.abs(offset);
                  const blur = active ? 0 : 2;

                  return (
                    <motion.button
                      key={powerup.id}
                      type="button"
                      onClick={() => selectIndex(index)}
                      layout
                      animate={{
                        x: xOffset,
                        scale,
                        opacity,
                        filter: `blur(${blur}px)`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8,
                      }}
                      style={{ zIndex, position: "absolute" }}
                      className={`shrink-0 text-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${active
                        ? "w-[19.2rem] sm:w-[26.4rem]"
                        : "w-[15.6rem] sm:w-[21.6rem]"
                        }`}
                      aria-pressed={active}
                      disabled={isLocked && !lockedCard}
                    >

                      <div className="relative z-[1] flex h-full flex-col items-center gap-3">
                        <motion.div
                          animate={{ scale: active ? 1 : 0.86 }}
                          transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 26,
                          }}
                        >
                          <CardComponent
                            size={active ? 384 : 288}
                            className={lockedCard ? "saturate-50" : ""}
                          />
                        </motion.div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Description text with crossfade */}
            <div className="mt-4 px-4 sm:mt-6">
              <div className="mx-auto flex min-h-[3rem] justify-center">
                <AnimatePresence mode="wait">
                  {activePowerup && (
                    <motion.p
                      key={activePowerup.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="max-w-[34rem] text-center text-sm leading-relaxed text-[rgba(241,243,252,0.6)] sm:text-[0.98rem]"
                    >
                      {activePowerup.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Dot indicators */}
            <div className="mt-3 flex items-center justify-center gap-2">
              {powerups.map((powerup, i) => (
                <button
                  key={powerup.id}
                  type="button"
                  onClick={() => selectIndex(i)}
                  disabled={isLocked}
                  className="relative h-2.5 w-2.5 rounded-full"
                  aria-label={`Select card ${i + 1}`}
                >
                  <span
                    className={`absolute inset-0 rounded-full transition-all duration-300 ${i === activeIndex
                      ? "scale-100 bg-[var(--primary)] shadow-[0_0_8px_rgba(224,141,255,0.5)]"
                      : "scale-75 bg-[rgba(241,243,252,0.2)]"
                      }`}
                  />
                  {i === activeIndex && (
                    <motion.span
                      layoutId="dot-indicator"
                      className="absolute -inset-0.5 rounded-full border border-[rgba(224,141,255,0.4)]"
                      transition={{ type: "spring", stiffness: 380, damping: 26 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="relative z-30 mx-auto mt-3 w-full max-w-xl px-4 py-2 sm:mt-5">
          <footer className="flex w-full flex-col items-center gap-3">
            <button
              type="button"
              className="inline-flex min-h-12 min-w-[17rem] items-center justify-center rounded-xl border border-[rgba(224,141,255,0.65)] bg-[linear-gradient(180deg,#d583ff,#c26cff)] px-7 font-(--font-mono) text-sm tracking-[0.18em] text-[#1d1225] uppercase shadow-[0_0_20px_rgba(197,108,255,0.45)] disabled:cursor-not-allowed disabled:opacity-65"
              onClick={() => {
                void toggleLockSelection();
              }}
              disabled={Boolean(missingRoomMessage) || lockSubmitting}
            >
              {lockSubmitting
                ? "Syncing Lock"
                : isLocked
                  ? "Unlock Selection"
                  : "Lock Selection"}
            </button>

            {lockStatusMessage && (
              <p className="text-center text-xs text-[rgba(241,243,252,0.68)]">
                {lockStatusMessage}
              </p>
            )}

            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-[rgba(241,243,252,0.2)] px-4 py-2 text-xs tracking-[0.1em] uppercase"
                onClick={() => navigate(`/${encodeURIComponent(username)}`)}
              >
                Back
              </button>
              <Link
                to={`/${encodeURIComponent(username)}`}
                className="rounded-md border border-[rgba(0,255,255,0.28)] px-4 py-2 text-xs tracking-[0.1em] text-(--secondary) uppercase"
              >
                Return to Arena
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
