import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Bolt, Keyboard, Radio, Zap } from "lucide-react";
import { panelFrameClass, panelNoiseClass } from "../components/uiClasses";

type PowerupSelectionPageProps = {
  userSlug: string;
  username: string;
};

type Powerup = {
  id: string;
  name: string;
  description: string;
  category: string;
  level: string;
  icon: typeof Bolt;
};

const powerups: Powerup[] = [
  {
    id: "key-swap",
    name: "Key Swap",
    description:
      "Randomly remaps key bindings for 5 seconds to disrupt rapid input combos.",
    category: "active",
    level: "lvl 2",
    icon: Keyboard,
  },
  {
    id: "flashbang",
    name: "Flashbang",
    description:
      "Triggers a bright terminal whiteout for 5 seconds to break opponent momentum.",
    category: "elite tier",
    level: "lvl 4",
    icon: Zap,
  },
  {
    id: "lag-spike",
    name: "Lag Spike",
    description:
      "Injects 200ms to 800ms jitter for the next 15 lines of typed code.",
    category: "disruptor",
    level: "lvl 1",
    icon: Radio,
  },
  {
    id: "phantom-tab",
    name: "Phantom Tab",
    description:
      "Opens fake warning overlays to force a costly context switch.",
    category: "mind game",
    level: "lvl 3",
    icon: Bolt,
  },
  {
    id: "echo-input",
    name: "Echo Input",
    description:
      "Duplicates each keystroke after a short delay, making precision edits harder.",
    category: "chaos",
    level: "lvl 5",
    icon: Keyboard,
  },
];

function mod(index: number, total: number) {
  if (total === 0) return 0;
  return ((index % total) + total) % total;
}

export function PowerupSelectionPage({ userSlug, username }: PowerupSelectionPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");

  const [activeIndex, setActiveIndex] = useState(1);
  const [lockedPowerupId, setLockedPowerupId] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const powerupRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const scrollAnimationRef = useRef<number | null>(null);

  const activePowerup = powerups[activeIndex];
  const isLocked = lockedPowerupId !== null;

  const toggleLockSelection = () => {
    setLockedPowerupId((currentLockedId) =>
      currentLockedId === null ? activePowerup.id : null,
    );
  };

  const cycle = (delta: number) => {
    if (isLocked) return;
    setActiveIndex((current) => mod(current + delta, powerups.length));
  };

  const selectIndex = (index: number) => {
    if (isLocked) return;
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
  }, [activePowerup.id, isLocked]);

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
        start + (selectedRect.left - railRect.left) - rail.clientWidth / 2 + selectedRect.width / 2,
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
      const eased = progress < 0.5
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

          <div
            ref={railRef}
            className={`hide-scrollbar flex items-end gap-4 px-1 pb-2 sm:gap-6 ${isLocked ? "overflow-x-hidden" : "overflow-x-auto"}`}
          >
            <div className="w-[calc(50%-6.75rem)] shrink-0 sm:w-[calc(50%-9.5rem)]" aria-hidden="true" />
            {powerups.map((powerup, index) => {
              const active = index === activeIndex;
              const lockedCard = lockedPowerupId === powerup.id;
              const Icon = powerup.icon;

              return (
                <button
                  key={powerup.id}
                  ref={(element) => {
                    powerupRefs.current[index] = element;
                  }}
                  type="button"
                  onClick={() => selectIndex(index)}
                  className={`${panelFrameClass} relative shrink-0 rounded-3xl border p-4 text-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${active ? "h-[13.5rem] w-[13.5rem] sm:h-[19rem] sm:w-[19rem]" : "h-[11rem] w-[11rem] border-[rgba(146,168,210,0.22)] bg-[rgba(11,17,28,0.58)] opacity-40 blur-[1.8px] sm:h-[15rem] sm:w-[15rem]"} ${active && lockedCard ? "border-[rgba(167,176,191,0.65)] bg-[rgba(22,25,33,0.9)] opacity-85" : ""} ${active && !lockedCard ? "border-[rgba(233,242,255,0.6)] bg-[rgba(8,22,30,0.9)] opacity-100 shadow-none" : ""}`}
                  aria-pressed={active}
                  disabled={isLocked && !lockedCard}
                >
                  {active && (
                    <span
                      className={`pointer-events-none absolute inset-0 z-20 rounded-3xl border-2 ${lockedCard ? "border-[rgba(167,176,191,0.8)]" : "border-[rgba(233,242,255,0.95)]"}`}
                      aria-hidden="true"
                    />
                  )}
                  <div className={panelNoiseClass} />
                  <div className="relative z-1 flex h-full flex-col items-center">
                    <div className={`inline-flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,22,0.82)] ${active ? "h-13 w-13 sm:h-14 sm:w-14" : "h-10 w-10 sm:h-11 sm:w-11"}`}>
                      <Icon className={`${active ? "h-6 w-6" : "h-5 w-5"} ${lockedCard ? "text-[rgba(196,206,218,0.7)]" : active ? "text-(--secondary)" : "text-[rgba(241,243,252,0.62)]"}`} />
                    </div>
                    <h2 className={`mt-4 font-(--font-heading) leading-none ${lockedCard ? "text-4xl text-[rgba(201,210,220,0.78)] sm:text-[2.25rem]" : active ? "text-4xl text-(--secondary) sm:text-[2.25rem]" : "text-2xl text-[rgba(241,243,252,0.86)]"}`}>
                      {powerup.name}
                    </h2>
                    <p className={`mt-3 max-w-[92%] leading-snug text-[rgba(241,243,252,0.74)] ${active ? "line-clamp-5 text-[0.92rem]" : "line-clamp-2 text-[0.72rem]"}`}>
                      {powerup.description}
                    </p>
                    <div className="mt-auto flex items-center justify-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 font-(--font-mono) tracking-[0.08em] uppercase ${lockedCard ? "border border-[rgba(167,176,191,0.45)] text-[0.62rem] text-[rgba(193,204,218,0.76)]" : active ? "border border-[rgba(0,255,255,0.32)] text-[0.62rem] text-(--secondary)" : "border border-[rgba(241,243,252,0.18)] text-[0.5rem] text-[rgba(241,243,252,0.56)]"}`}>
                        {powerup.category}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 font-(--font-mono) tracking-[0.08em] uppercase ${lockedCard ? "border-[rgba(167,176,191,0.45)] text-[rgba(193,204,218,0.72)] text-[0.62rem]" : "border-[rgba(241,243,252,0.18)] text-[rgba(241,243,252,0.7)]"} ${active ? "text-[0.62rem]" : "text-[0.5rem]"}`}>
                        {powerup.level}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="w-[calc(50%-6.75rem)] shrink-0 sm:w-[calc(50%-9.5rem)]" aria-hidden="true" />
          </div>
        </section>

        <div className="relative z-30 mx-auto mt-6 w-full max-w-xl px-4 py-2 sm:mt-10">
          <footer className="flex w-full flex-col items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-12 min-w-[17rem] items-center justify-center rounded-xl border border-[rgba(224,141,255,0.65)] bg-[linear-gradient(180deg,#d583ff,#c26cff)] px-7 font-(--font-mono) text-sm tracking-[0.18em] text-[#1d1225] uppercase shadow-[0_0_20px_rgba(197,108,255,0.45)] disabled:cursor-not-allowed disabled:opacity-65"
            onClick={toggleLockSelection}
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
