import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSpacetimeDB, useTable } from "spacetimedb/react";
import { FlashbangCard } from "../assets/power_card/FlashbangCard";
import { KeySwapCard } from "../assets/power_card/KeySwapCard";
import { LineJumperCard } from "../assets/power_card/LineJumperCard";
import { MirrorShieldCard } from "../assets/power_card/MirrorShieldCard";
import { NoMistakesCard } from "../assets/power_card/NoMistakesCard";
import { SkullCard as NoRetreatCard } from "../assets/power_card/NoRetreat";
import { TimeHeistCard } from "../assets/power_card/TimeHeistCard";
import { TimeKumCard } from "../assets/power_card/TimeKumCard";
import { VisuallyImpairedCard } from "../assets/power_card/VisuallyImpairedCard";
import { tables } from "../module_bindings";

type PowerupSelectionPageProps = {
  userSlug: string;
  username: string;
};

type PowerCardComponent = ComponentType<{
  size?: number;
  label?: string;
  className?: string;
}>;

type Powerup = {
  id: string;
  component: PowerCardComponent;
};

const powerCardMap: Record<string, Powerup> = {
  FlashbangCard: {
    id: "FlashbangCard",
    component: FlashbangCard,
  },
  KeySwapCard: {
    id: "KeySwapCard",
    component: KeySwapCard,
  },
  LineJumperCard: {
    id: "LineJumperCard",
    component: LineJumperCard,
  },
  MirrorShieldCard: {
    id: "MirrorShieldCard",
    component: MirrorShieldCard,
  },
  NoMistakesCard: {
    id: "NoMistakesCard",
    component: NoMistakesCard,
  },
  NoRetreat: {
    id: "NoRetreat",
    component: NoRetreatCard,
  },
  TimeHeistCard: {
    id: "TimeHeistCard",
    component: TimeHeistCard,
  },
  TimeKumCard: {
    id: "TimeKumCard",
    component: TimeKumCard,
  },
  VisuallyImpairedCard: {
    id: "VisuallyImpairedCard",
    component: VisuallyImpairedCard,
  },
};

function mod(index: number, total: number) {
  if (total === 0) return 0;
  return ((index % total) + total) % total;
}

export function PowerupSelectionPage({
  userSlug,
  username,
}: PowerupSelectionPageProps) {
  const { identity } = useSpacetimeDB();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room")?.trim().toUpperCase() ?? null;

  const [arenaRoomRows, arenaRoomsReady] = useTable(tables.arenaRoom);
  const [arenaMemberRows, arenaMembersReady] = useTable(tables.arenaRoomMember);

  const room = useMemo(() => {
    if (!roomId) return null;
    return arenaRoomRows.find((row) => row.roomId === roomId) ?? null;
  }, [arenaRoomRows, roomId]);

  const sortedRoomMembers = useMemo(() => {
    if (!roomId) return [];

    return arenaMemberRows
      .filter((member) => member.roomId === roomId)
      .sort((left, right) => {
        if (left.joinedAt.microsSinceUnixEpoch < right.joinedAt.microsSinceUnixEpoch) {
          return -1;
        }
        if (left.joinedAt.microsSinceUnixEpoch > right.joinedAt.microsSinceUnixEpoch) {
          return 1;
        }
        return left.memberIdentity
          .toHexString()
          .localeCompare(right.memberIdentity.toHexString());
      });
  }, [arenaMemberRows, roomId]);

  const powerups = useMemo(() => {
    if (!room || !identity) return [];

    const isMemberInRoom = sortedRoomMembers.some((member) =>
      member.memberIdentity.isEqual(identity),
    );
    if (!isMemberInRoom) return [];

    const selectedIds = room.rolledPowers.slice(0, 3);

    return selectedIds
      .map((powerId) => powerCardMap[powerId])
      .filter((value): value is Powerup => Boolean(value));
  }, [identity, room, sortedRoomMembers]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lockedPowerupId, setLockedPowerupId] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const powerupRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const scrollAnimationRef = useRef<number | null>(null);

  const activePowerup = powerups[activeIndex];
  const isLocked = lockedPowerupId !== null;

  useEffect(() => {
    if (powerups.length === 0) {
      setActiveIndex(0);
      setLockedPowerupId(null);
      return;
    }

    setActiveIndex((current) => mod(current, powerups.length));
  }, [powerups.length]);

  const toggleLockSelection = () => {
    if (!activePowerup) return;
    setLockedPowerupId((currentLockedId) =>
      currentLockedId === null ? activePowerup.id : null,
    );
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
        toggleLockSelection();
        return;
      }

      if (isLocked) return;

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

    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }

    const start = rail.scrollLeft;
    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
    const selectedRect = selectedPowerup.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const target = Math.max(
      0,
      Math.min(
        start +
          (selectedRect.left - railRect.left) -
          rail.clientWidth / 2 +
          selectedRect.width / 2,
        maxScrollLeft,
      ),
    );

    if (Math.abs(target - start) < 1) {
      return;
    }

    const duration = 760;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      rail.scrollLeft = start + (target - start) * eased;

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animate);
      } else {
        scrollAnimationRef.current = null;
      }
    };

    scrollAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (scrollAnimationRef.current !== null) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };
  }, [activeIndex]);

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
              Lock one tactical advantage before entering the match.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[rgba(241,243,252,0.74)]">
            <span className="rounded-full border border-[rgba(241,243,252,0.16)] px-3 py-1.5 font-(--font-mono) tracking-[0.08em] uppercase">
              User {username}
            </span>
            {roomId && (
              <span className="rounded-full border border-[rgba(0,255,255,0.24)] px-3 py-1.5 font-(--font-mono) tracking-[0.08em] text-(--secondary) uppercase">
                Room {roomId}
              </span>
            )}
          </div>
        </header>

        <section className="relative left-1/2 z-20 mt-6 w-screen -translate-x-1/2 px-4 sm:mt-10 sm:px-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-[#070b12] to-transparent sm:w-18" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-[#070b12] to-transparent sm:w-18" />

          {(!arenaRoomsReady || !arenaMembersReady) && (
            <p className="mb-4 text-center text-xs tracking-[0.1em] text-[rgba(241,243,252,0.66)] uppercase">
              Syncing room powers...
            </p>
          )}
          {arenaRoomsReady && arenaMembersReady && powerups.length === 0 && (
            <p className="mb-4 text-center text-xs tracking-[0.1em] text-[rgba(241,243,252,0.66)] uppercase">
              Waiting for rolled powers from backend.
            </p>
          )}

          <div
            ref={railRef}
            className={`hide-scrollbar flex items-end gap-4 px-1 pb-2 sm:gap-6 ${isLocked ? "overflow-x-hidden" : "overflow-x-auto"}`}
          >
            <div
              className="w-[calc(50%-6.75rem)] shrink-0 sm:w-[calc(50%-9.5rem)]"
              aria-hidden="true"
            />
            {powerups.map((powerup, index) => {
              const active = index === activeIndex;
              const lockedCard = lockedPowerupId === powerup.id;
              const PowerupComponent = powerup.component;

              return (
                <button
                  key={powerup.id}
                  ref={(element) => {
                    powerupRefs.current[index] = element;
                  }}
                  type="button"
                  onClick={() => selectIndex(index)}
                  className={`relative shrink-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${active ? "h-[13.5rem] w-[13.5rem] sm:h-[19rem] sm:w-[19rem]" : "h-[11rem] w-[11rem] opacity-40 blur-[1.8px] sm:h-[15rem] sm:w-[15rem]"} ${active && lockedCard ? "opacity-85" : ""} ${active && !lockedCard ? "opacity-100 shadow-none" : ""}`}
                  aria-pressed={active}
                  disabled={isLocked && !lockedCard}
                >
                  <PowerupComponent
                    size={
                      active
                        ? window.innerWidth >= 640
                          ? 304
                          : 216
                        : window.innerWidth >= 640
                          ? 240
                          : 176
                    }
                    className={`${active ? "" : "opacity-40 blur-[1.8px]"}`}
                  />
                </button>
              );
            })}
            <div
              className="w-[calc(50%-6.75rem)] shrink-0 sm:w-[calc(50%-9.5rem)]"
              aria-hidden="true"
            />
          </div>
        </section>

        <div className="relative z-30 mx-auto mt-6 w-full max-w-xl px-4 py-2 sm:mt-10">
          <footer className="flex w-full flex-col items-center gap-3">
            <button
              type="button"
              className="inline-flex min-h-12 min-w-[17rem] items-center justify-center rounded-xl border border-[rgba(224,141,255,0.65)] bg-[linear-gradient(180deg,#d583ff,#c26cff)] px-7 font-(--font-mono) text-sm tracking-[0.18em] text-[#1d1225] uppercase shadow-[0_0_20px_rgba(197,108,255,0.45)] disabled:cursor-not-allowed disabled:opacity-65"
              onClick={toggleLockSelection}
              disabled={powerups.length === 0}
            >
              {isLocked ? "Unlock Selection" : "Lock Selection"}
            </button>

            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-[rgba(241,243,252,0.2)] px-4 py-2 text-xs tracking-[0.1em] uppercase"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
              <Link
                to={`/user/${encodeURIComponent(userSlug)}`}
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
