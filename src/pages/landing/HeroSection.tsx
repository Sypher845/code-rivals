import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Swords, Timer } from "lucide-react";
import { BrandMark } from "./SharedComponents";
import { navLinks, topPowers } from "./landing-data";

type NavbarProps = {
  isAuthenticated: boolean;
  userSlug?: string;
  username?: string;
};

export function Navbar({ isAuthenticated, userSlug, username }: NavbarProps) {
  const [navScrolled, setNavScrolled] = useState(false);

  const userArenaPath =
    isAuthenticated && userSlug
      ? `/user/${encodeURIComponent(userSlug)}`
      : "/login";

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-200 ${
        navScrolled
          ? "border-[var(--border-subtle)] bg-[rgba(8,9,10,0.92)] backdrop-blur-xl"
          : "border-[rgba(255,255,255,0.06)] bg-[rgba(8,9,10,0.72)] backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 xl:px-10">
        <Link to="/" className="inline-flex items-center gap-3">
          <BrandMark />
          <span className="text-sm font-semibold tracking-[-0.02em]">
            CodeRivals
          </span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center md:flex">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--on-background)]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="inline-flex items-center gap-2">
          <Link
            to={isAuthenticated ? userArenaPath : "/login"}
            className="inline-flex min-h-9 items-center rounded-lg px-3.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--on-background)]"
          >
            {isAuthenticated ? "Arena" : "Log in"}
          </Link>
          {!isAuthenticated && (
            <Link
              to="/signup"
              className="inline-flex min-h-9 items-center rounded-lg border border-transparent bg-[var(--primary)] px-3.5 text-sm font-medium text-black shadow-[0_0_18px_rgba(224,141,255,0.28)] transition hover:-translate-y-px hover:opacity-90"
            >
              Sign up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

type HeroTimerProps = object;

function HeroTimer() {
  const [secondsRemaining, setSecondsRemaining] = useState(7 * 60 + 43);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSecondsRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const seconds = String(secondsRemaining % 60).padStart(2, "0");

  return (
    <div className="flex items-center justify-between rounded-lg border border-[rgba(0,255,255,0.14)] bg-[rgba(0,255,255,0.04)] px-3 py-3">
      <span className="inline-flex items-center gap-2 text-[0.64rem] tracking-[0.16em] text-[var(--text-tertiary)] uppercase">
        <Timer className="h-3.5 w-3.5" />
        Time remaining
      </span>
      <span className="text-[1.15rem] font-semibold tracking-[0.08em] text-[var(--secondary)] tabular-nums">
        {minutes}:{seconds}
      </span>
    </div>
  );
}

type HeroSectionProps = {
  isAuthenticated: boolean;
  userSlug?: string;
  username?: string;
};

export function HeroSection({
  isAuthenticated,
  userSlug,
  username,
}: HeroSectionProps) {
  const userArenaPath =
    isAuthenticated && userSlug
      ? `/user/${encodeURIComponent(userSlug)}`
      : "/login";

  const primaryCtaLabel = isAuthenticated ? "Open my arena" : "Start a duel";
  const secondaryCtaLabel = isAuthenticated
    ? `Continue as ${username ?? "pilot"}`
    : "Watch live";

  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-32 sm:px-8 xl:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[32rem] max-w-[70rem] bg-[radial-gradient(ellipse_at_top,rgba(224,141,255,0.1),transparent_68%)]" />

      <div className="mx-auto max-w-7xl">
        <a
          href="#features"
          data-landing-reveal="hero"
          className="landing-reveal inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--on-background)]"
        >
          <span className="rounded-full border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.12)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--primary)] uppercase tracking-[0.08em]">
            New
          </span>
          <span>SpacetimeDB rooms, zero refresh drift</span>
          <ArrowRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        </a>

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] lg:items-start xl:gap-16">
          <div className="max-w-2xl">
            <h1
              data-landing-reveal="hero"
              className="landing-reveal landing-delay-1 text-[clamp(2.9rem,7vw,5.4rem)] leading-[0.92] font-semibold tracking-[-0.05em]"
            >
              Code against
              <br />
              someone. Live.
            </h1>
            <p
              data-landing-reveal="hero"
              className="landing-reveal landing-delay-2 mt-5 max-w-xl text-[0.98rem] leading-8 text-[var(--text-secondary)] sm:text-[1.02rem]"
            >
              Turn algorithm practice into a competitive duel. Three
              escalating rounds, real sabotage mechanics, and ELO ratings that
              actually mean something.
            </p>

            <div
              data-landing-reveal="hero"
              className="landing-reveal landing-delay-3 mt-9 flex flex-wrap items-center gap-3"
            >
              <Link
                to={isAuthenticated ? userArenaPath : "/signup"}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-transparent bg-[var(--on-background)] px-5 text-sm font-medium text-[var(--background)] transition hover:-translate-y-px hover:opacity-90 hover:shadow-[0_12px_22px_rgba(0,0,0,0.36)]"
              >
                <Swords className="h-4 w-4" />
                <span>{primaryCtaLabel}</span>
              </Link>
              <Link
                to={isAuthenticated ? userArenaPath : "/login"}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] hover:text-[var(--on-background)]"
              >
                <Play className="h-4 w-4" />
                <span>{secondaryCtaLabel}</span>
              </Link>
            </div>
          </div>

          <div
            data-landing-reveal="hero"
            className="landing-reveal landing-delay-2 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] font-[var(--font-mono)] shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[var(--border-strong)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(224,141,255,0.06)]"
          >
            <div className="flex h-11 items-center justify-between border-b border-[var(--border-subtle)] px-4">
              <span className="text-[0.68rem] font-medium tracking-[0.18em] text-[var(--text-tertiary)] uppercase">
                Match in Progress
              </span>
              <span className="inline-flex items-center gap-2 text-[0.68rem] font-medium text-[var(--secondary)]">
                <span className="landing-live-dot" />
                Live
              </span>
            </div>

            <div className="flex flex-col gap-3 p-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
                  <p className="text-xs font-semibold text-[var(--on-background)]">
                    r4ndom_pikachu
                  </p>
                  <p className="mt-0.5 text-[0.64rem] text-[var(--text-tertiary)]">
                    1847 ELO · Diamond II
                  </p>
                </div>
                <span className="text-[0.65rem] font-semibold tracking-[0.24em] text-[var(--text-tertiary)] uppercase">
                  VS
                </span>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
                  <p className="text-xs font-semibold text-[var(--on-background)]">
                    mradul_dev
                  </p>
                  <p className="mt-0.5 text-[0.64rem] text-[var(--text-tertiary)]">
                    1802 ELO · Diamond I
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Round 1", value: "5 min", active: false },
                  { label: "Round 2", value: "10 min", active: true },
                  { label: "Round 3", value: "15 min", active: false },
                ].map((round) => (
                  <div
                    key={round.label}
                    className={`rounded-lg border px-3 py-2 text-center transition ${
                      round.active
                        ? "border-[rgba(224,141,255,0.3)] bg-[rgba(224,141,255,0.06)]"
                        : "border-[var(--border-subtle)] bg-[var(--surface-subtle)]"
                    }`}
                  >
                    <p className="text-[0.58rem] tracking-[0.22em] text-[var(--text-tertiary)] uppercase">
                      {round.label}
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        round.active
                          ? "text-[var(--primary)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {round.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {topPowers.map((power, index) => (
                  <span
                    key={power}
                    className={`rounded-full border px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.04em] ${
                      index === 0
                        ? "border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.1)] text-[var(--primary)]"
                        : index === 1
                          ? "border-[rgba(0,255,255,0.18)] bg-[rgba(0,255,255,0.08)] text-[var(--secondary)]"
                          : "border-[rgba(77,143,255,0.2)] bg-[rgba(77,143,255,0.1)] text-[var(--tertiary)]"
                    }`}
                  >
                    {power}
                  </span>
                ))}
              </div>

              <HeroTimer />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
