import type { ReactNode } from "react";
import {
  authLinkClass,
  authPanelClass,
  authShellClass,
  eyebrowClass,
  heroPanelClass,
  panelNoiseClass,
} from "./uiClasses";

const heroTags = [
  "SpacetimeDB auth",
  "Username + password",
  "Persistent session mapping",
];

type AuthLayoutProps = {
  activeTab: "login" | "signup";
  children: ReactNode;
  helperMessage: string;
  onTabChange: (tab: "login" | "signup") => void;
  statusMessage: string;
  statusTone: "error" | "neutral";
  title: string;
};

export function AuthLayout({
  activeTab,
  children,
  helperMessage,
  onTabChange,
  statusMessage,
  statusTone,
  title,
}: AuthLayoutProps) {
  const panelLabel =
    activeTab === "signup" ? "NEW CHALLENGER" : "RETURNING RIVAL";

  return (
    <main className={authShellClass}>
      <section className={heroPanelClass}>
        <div className={panelNoiseClass} />
        <div className="relative z-[1] flex max-w-[42rem] flex-col gap-7">
          <p className={eyebrowClass}>NEON COMMAND PALETTE</p>
          <h1 className="grid gap-[0.15rem] text-[clamp(3.3rem,7vw,5.9rem)] leading-[0.92] font-bold tracking-[-0.06em] uppercase [text-shadow:0_0_24px_rgba(241,243,252,0.12)] max-xl:text-[clamp(2.8rem,13vw,5rem)]">
            <span>BOOT INTO</span>
            <span>THE 1V1</span>
            <span>CODING</span>
            <span>ARENA.</span>
          </h1>
          <p className="max-w-[36rem] text-[1.28rem] leading-[1.7] text-[var(--muted-foreground)] max-md:text-base">
            CodeRival is a real-time competitive coding e-sport. This first
            screen should feel like a command deck: sharp, futuristic, and fast
            to use.
          </p>
          {/* <div className="flex flex-wrap gap-[0.7rem]">
            {heroTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--ghost-border)] bg-[rgba(9,15,22,0.72)] px-5 py-[0.95rem] font-[var(--font-mono)] text-[0.98rem] text-[var(--on-background)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                {tag}
              </span>
            ))}
          </div> */}
        </div>

        <div className="pointer-events-none absolute right-[-5rem] bottom-[-8rem] h-96 w-96 rounded-full opacity-90 blur-[36px] [background:radial-gradient(circle,rgba(224,141,255,0.18),rgba(0,0,0,0)_68%)]" />
        <div className="pointer-events-none absolute top-4 left-[-6rem] h-72 w-72 rounded-full opacity-90 blur-[36px] [background:radial-gradient(circle,rgba(0,255,255,0.12),rgba(0,0,0,0)_68%)]" />
      </section>

      <section className={authPanelClass}>
        <div className={panelNoiseClass} />
        <header className="relative z-[1] mb-4 flex items-start justify-between gap-4 max-md:flex-col">
          <div>
            <p className={eyebrowClass}>{panelLabel}</p>
          </div>
          <div
            className="inline-flex items-center rounded-full border border-[rgba(224,141,255,0.26)] bg-[rgba(19,21,31,0.85)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] max-md:w-full"
            role="tablist"
            aria-label="Auth mode"
          >
            <button
              type="button"
              className={`min-w-[5.7rem] rounded-full border px-[1.2rem] py-[0.85rem] text-base text-[var(--on-background)] max-md:flex-1 ${
                activeTab === "login"
                  ? "border-[rgba(224,141,255,0.32)] bg-[linear-gradient(135deg,rgba(224,141,255,0.23),rgba(32,63,126,0.7))] shadow-[0_0_0_1px_rgba(224,141,255,0.12)]"
                  : "border-transparent bg-transparent"
              }`}
              onClick={() => onTabChange("login")}
            >
              Log in
            </button>
            <button
              type="button"
              className={`min-w-[5.7rem] rounded-full border px-[1.2rem] py-[0.85rem] text-base text-[var(--on-background)] max-md:flex-1 ${
                activeTab === "signup"
                  ? "border-[rgba(224,141,255,0.32)] bg-[linear-gradient(135deg,rgba(224,141,255,0.23),rgba(32,63,126,0.7))] shadow-[0_0_0_1px_rgba(224,141,255,0.12)]"
                  : "border-transparent bg-transparent"
              }`}
              onClick={() => onTabChange("signup")}
            >
              Sign up
            </button>
          </div>
        </header>

        <div className="relative z-[1] flex flex-1 flex-col">
          <h2 className="mt-[0.2rem] max-w-[9.5ch] text-[clamp(3rem,4vw,4.8rem)] leading-[0.92] font-bold tracking-[-0.06em] uppercase max-md:max-w-none max-md:text-[clamp(2.4rem,14vw,3.3rem)]">
            {title}
          </h2>
          <p className="mt-[1.1rem] text-[1.08rem] leading-[1.8] text-[var(--muted-foreground)] max-md:text-base">
            {helperMessage}
          </p>

          {children}

          <div
            className={
              statusTone === "error"
                ? "mt-4 flex min-h-12 items-center rounded-2xl border border-[rgba(224,141,255,0.2)] bg-[rgba(45,22,41,0.72)] px-4 py-[0.95rem] text-base leading-6 text-[var(--on-background)] shadow-[0_0_0_1px_rgba(224,141,255,0.08)]"
                : "mt-4 flex min-h-12 items-center rounded-2xl border border-[rgba(224,141,255,0.2)] bg-[rgba(29,18,39,0.52)] px-4 py-[0.95rem] text-base leading-6 text-[rgba(241,243,252,0.76)]"
            }
          >
            {statusMessage}
          </div>

          <p className="mt-4 text-[1.02rem] text-[rgba(241,243,252,0.66)]">
            {activeTab === "signup"
              ? "Already registered?"
              : "Need a new rival tag?"}{" "}
            <button
              type="button"
              className={authLinkClass}
              onClick={() =>
                onTabChange(activeTab === "signup" ? "login" : "signup")
              }
            >
              {activeTab === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>

          <div className="mt-auto pt-6" />
        </div>
      </section>
    </main>
  );
}
