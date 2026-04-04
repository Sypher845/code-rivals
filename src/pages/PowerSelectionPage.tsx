import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Identity } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const normalizedRoomId = roomId?.trim().toUpperCase() ?? null;

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
  const [lockedPowerupId, setLockedPowerupId] = useState<string | null>(null);
  const [lockStatusMessage, setLockStatusMessage] = useState<string | null>(null);
  const [lockSubmitting, setLockSubmitting] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);
  const powerupRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    powerupRefs.current = [];
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
        `/${encodeURIComponent(username)}/powerups/ready?${new URLSearchParams({
          room: normalizedRoomId,
        }).toString()}`,
      );
    } catch (error) {
      setLockStatusMessage(
        error instanceof Error ? error.message : "Unable to update powerup lock.",
      );
    } finally {
      setLockSubmitting(false);
    }
  };

  const cycle = (delta: number) => {
    if (isLocked || powerups.length === 0) return;
    setActiveIndex((current) => mod(current + delta, powerups.length));
  };

  const selectIndex = (index: number) => {
    if (isLocked || powerups.length === 0) return;
    setActiveIndex(mod(index, powerups.length));
  };

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
  }, [activePowerup?.id, isLocked, powerups.length]);

  useEffect(() => {
    const rail = railRef.current;
    const selectedPowerup = powerupRefs.current[activeIndex];
    if (!rail || !selectedPowerup) return;

    selectedPowerup.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  useEffect(() => {
    if (!normalizedRoomId || !activeRoom) {
      return;
    }

    const query = new URLSearchParams({ room: normalizedRoomId }).toString();
    if (activeRoom.matchState === "round_intro") {
      navigate(`/${encodeURIComponent(username)}/powerups/ready?${query}`, {
        replace: true,
      });
      return;
    }

    if (activeRoom.matchState === "playing") {
      navigate(`/${encodeURIComponent(username)}/match?${query}`, {
        replace: true,
      });
    }
  }, [activeRoom, navigate, normalizedRoomId, username]);

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
          <section className="relative left-1/2 z-20 mt-6 min-h-[24.5rem] w-screen -translate-x-1/2 px-4 sm:mt-8 sm:min-h-[32rem] sm:px-8">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-[#070b12] to-transparent sm:w-18" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-[#070b12] to-transparent sm:w-18" />

            <div
              ref={railRef}
              className={`hide-scrollbar flex items-start gap-4 px-1 pb-2 sm:gap-6 ${isLocked ? "overflow-x-hidden" : "overflow-x-auto"}`}
            >
              <div className="w-[calc(50%-9.6rem)] shrink-0 sm:w-[calc(50%-13.2rem)]" aria-hidden="true" />
              {powerups.map((powerup, index) => {
                const active = index === activeIndex;
                const lockedCard = lockedPowerupId === powerup.id;
                const CardComponent = powerup.Card;

                return (
                  <motion.button
                    key={powerup.id}
                    ref={(element) => {
                      powerupRefs.current[index] = element;
                    }}
                    type="button"
                    onClick={() => selectIndex(index)}
                    initial={false}
                    animate={{
                      scale: active ? 1 : 0.9,
                      opacity: active ? 1 : 0.45,
                      y: active ? 0 : 8,
                      filter: active ? "blur(0px)" : "blur(1.2px)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 28,
                      mass: 0.9,
                    }}
                    className={`${panelFrameClass} relative shrink-0 rounded-3xl border p-4 text-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${
                      active
                        ? "w-[19.2rem] sm:w-[26.4rem]"
                        : "w-[15.6rem] border-[rgba(146,168,210,0.22)] bg-[rgba(11,17,28,0.58)] sm:w-[21.6rem]"
                    } ${
                      active && lockedCard
                        ? "border-[rgba(167,176,191,0.65)] bg-[rgba(22,25,33,0.9)] opacity-90"
                        : ""
                    } ${
                      active && !lockedCard
                        ? "border-[rgba(233,242,255,0.6)] bg-[rgba(8,22,30,0.9)] opacity-100"
                        : ""
                    }`}
                    aria-pressed={active}
                    disabled={isLocked && !lockedCard}
                  >
                    {active && (
                      <span
                        className={`pointer-events-none absolute inset-0 z-20 rounded-3xl border-2 ${
                          lockedCard
                            ? "border-[rgba(167,176,191,0.8)]"
                            : "border-[rgba(233,242,255,0.95)]"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative z-1 flex h-full flex-col items-center gap-3">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: active ? 1 : 0.86,
                        }}
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
              <div className="w-[calc(50%-9.6rem)] shrink-0 sm:w-[calc(50%-13.2rem)]" aria-hidden="true" />
            </div>

            <div className="mt-4 px-4 sm:mt-6">
              <div className="mx-auto flex justify-center">
                {activePowerup && (
                  <p className="max-w-[34rem] text-center text-sm leading-relaxed text-[rgba(241,243,252,0.6)] sm:text-[0.98rem]">
                    {activePowerup.description}
                  </p>
                )}
              </div>
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
