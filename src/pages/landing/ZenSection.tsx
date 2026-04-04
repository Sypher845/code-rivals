import { Moon, Sparkles, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionEyebrow } from "./SharedComponents";

type ZenSectionProps = {
  isAuthenticated: boolean;
  username?: string;
};

const zenHighlights = [
  {
    icon: Timer,
    title: "Keep the real round cadence",
    description:
      "Zen runs the same three-step pacing as the arena: 5, 10, then 15 minutes.",
  },
  {
    icon: Moon,
    title: "Strip the noise back",
    description:
      "The coding view switches to a sober black-and-gray layout built for quiet, focused practice.",
  },
  {
    icon: Sparkles,
    title: "Optional self sabotage",
    description:
      "Turn it on to take one random hit from No Retreat, Time Kum, or Line Jumper during the round.",
  },
];

export function ZenSection({ isAuthenticated, username }: ZenSectionProps) {
  const zenPath =
    isAuthenticated && username
      ? `/${encodeURIComponent(username)}/zen/R1`
      : "/login";

  return (
    <section
      id="zen"
      className="border-t border-[var(--border-subtle)] px-5 py-24 sm:px-8 xl:px-10"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
        <div data-landing-reveal className="landing-reveal">
          <SectionEyebrow icon={Moon}>Zen mode</SectionEyebrow>
          <h2 className="text-[clamp(2.15rem,4vw,3.4rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
            Quiet practice.
            <br />
            Same pressure curve.
          </h2>
          <p className="mt-4 max-w-xl text-[0.98rem] leading-8 text-[var(--text-secondary)]">
            Zen Mode is the solo lane inside CodeRivals. You launch it from the
            arena header, step through all three rounds on your own, and keep
            the real duel pacing without the multiplayer noise.
          </p>
          <p className="mt-4 max-w-xl text-[0.98rem] leading-8 text-[var(--text-secondary)]">
            When you want a harder rep, enable self sabotage and let the system
            apply one random disruption before the round begins. When you want
            clean focus, leave it off and just practice.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={zenPath}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-transparent bg-[var(--on-background)] px-5 text-sm font-medium text-[var(--background)] transition hover:-translate-y-px hover:opacity-90"
            >
              <Moon className="h-4 w-4" />
              <span>{isAuthenticated ? "Open Zen Mode" : "Log in for Zen Mode"}</span>
            </Link>
          </div>
        </div>

        <div
          data-landing-reveal
          className="landing-reveal landing-delay-2 overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#111214,#0c0d0f)] shadow-[0_24px_64px_rgba(0,0,0,0.36)]"
        >
          <div className="border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-[var(--font-mono)] text-[0.68rem] tracking-[0.22em] text-[#8d8d8d] uppercase">
                  Zen Mode
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#f2f2f2]">
                  Practice session deck
                </h3>
              </div>
              <div className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 font-[var(--font-mono)] text-[0.68rem] tracking-[0.18em] text-[#d0d0d0] uppercase">
                Solo
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-[rgba(255,255,255,0.07)] md:grid-cols-3">
            {zenHighlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className={`bg-[#111214] px-6 py-6 ${
                    index === 1 ? "md:bg-[#141518]" : ""
                  }`}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#17181b]">
                    <Icon className="h-4.5 w-4.5 text-[#e6e6e6]" />
                  </div>
                  <h4 className="mt-4 text-[1.02rem] font-medium tracking-[-0.02em] text-[#f1f1f1]">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-sm leading-7 text-[#9a9a9a]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
