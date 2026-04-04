import { BarChart3, Swords, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionEyebrow, BrandMark } from "./SharedComponents";
import { stats, logoStrip } from "./landing-data";


export function LogoStrip() {
  return (
    <section className="border-y border-[var(--border-subtle)] px-5 py-8 sm:px-8 xl:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-center font-[var(--font-mono)] text-[0.68rem] font-medium tracking-[0.24em] text-[var(--text-tertiary)] uppercase">
          Played by competitive programmers from
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logoStrip.map((label) => (
            <span
              key={label}
              className="text-xs font-medium tracking-[0.14em] text-[var(--text-tertiary)] uppercase transition hover:text-[var(--text-secondary)]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

type CTASectionProps = {
  isAuthenticated: boolean;
  username?: string;
};

export function CTASection({ isAuthenticated, username }: CTASectionProps) {
  const userArenaPath =
    isAuthenticated && username
      ? `/${encodeURIComponent(username)}`
      : "/login";

  const footerCtaLabel = isAuthenticated ? "Open arena" : "Create free account";

  return (
    <section className="relative overflow-hidden border-t border-[var(--border-subtle)] px-5 py-24 text-center sm:px-8 xl:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(224,141,255,0.08),transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl">
        <span className="text-[0.68rem] font-medium tracking-[0.24em] text-[var(--text-tertiary)] uppercase">
          Ready to compete?
        </span>
        <h2
          data-landing-reveal
          className="landing-reveal mt-4 text-[clamp(2.4rem,5vw,4.2rem)] leading-[0.96] font-semibold tracking-[-0.05em]"
        >
          Stop practicing.
          <br />
          Start dueling.
        </h2>
        <p
          data-landing-reveal
          className="landing-reveal landing-delay-1 mx-auto mt-4 max-w-xl text-[0.98rem] leading-8 text-[var(--text-secondary)]"
        >
          Create a free account, challenge someone, and find out what it
          actually feels like to code under pressure.
        </p>
        <div
          data-landing-reveal
          className="landing-reveal landing-delay-2 mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to={isAuthenticated ? userArenaPath : "/signup"}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-transparent bg-[var(--on-background)] px-5 text-sm font-medium text-[var(--background)] transition hover:-translate-y-px hover:opacity-90"
          >
            <Swords className="h-4 w-4" />
            <span>{footerCtaLabel}</span>
          </Link>
          
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] px-5 py-7 sm:px-8 xl:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
          <BrandMark />
          <span>CodeRivals · © 2026</span>
        </div>
      </div>
    </footer>
  );
}
