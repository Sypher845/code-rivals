import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Send,
  Check,
  Timer,
  Keyboard,
  Shield,
} from "lucide-react";
import { POWER_CARD_REGISTRY } from "../powerups/powerupRegistry";
import { POWER_CARD, OPPONENT } from "./constants";

/* ═══════════════════════════ MATCH TIMER ═════════════════════════════ */

function MatchTimer() {
  const [secondsRemaining, setSecondsRemaining] = useState(7 * 60 + 43);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSecondsRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const seconds = String(secondsRemaining % 60).padStart(2, "0");

  const isLow = secondsRemaining < 60;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-[rgba(0,255,255,0.18)] bg-[rgba(0,255,255,0.04)] px-4 py-2">
      <Timer className={`h-4.5 w-4.5 ${isLow ? "text-[var(--signal-danger)]" : "text-[var(--secondary)]"}`} />
      <span
        className={`text-lg font-bold tracking-[0.08em] tabular-nums ${isLow ? "text-[var(--signal-danger)] animate-pulse" : "text-[var(--secondary)]"
          }`}
      >
        {minutes}:{seconds}
      </span>
    </div>
  );
}

/* ═══════════════════════════ OPPONENT CARD ═══════════════════════════ */

function OpponentCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] px-4 py-2">
      {/* avatar placeholder */}
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--ghost-border)] bg-[rgba(224,141,255,0.08)] text-sm font-bold text-[var(--primary)]">
        {OPPONENT.username[0].toUpperCase()}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-[var(--on-background)]">
          {OPPONENT.username}
        </span>

        <div className="flex items-center gap-2.5">
          {/* typing indicator */}
          {OPPONENT.isTyping && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--secondary)]">
              <Keyboard className="h-3 w-3" />
              <span className="flex gap-[2px]">
                <span className="landing-typing-dot" style={{ animationDelay: "0ms" }} />
                <span className="landing-typing-dot" style={{ animationDelay: "200ms" }} />
                <span className="landing-typing-dot" style={{ animationDelay: "400ms" }} />
              </span>
            </span>
          )}

          {/* card used */}
          {OPPONENT.cardUsed && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] px-2 py-0.5 text-[0.7rem] font-medium text-[var(--primary)]">
              <Shield className="h-3 w-3" />
              {OPPONENT.cardUsed}
            </span>
          )}

          {/* submitted status */}
          {OPPONENT.hasSubmitted && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7cd87c]">
              <Check className="h-3 w-3" />
              Submitted
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ SABOTAGE BUTTON ═════════════════════════ */

function formatCardName(key: string): string {
  return key.replace(/Card$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function SabotageButton({ cardName, opponentName }: { cardName: string; opponentName: string }) {
  const [hovered, setHovered] = useState(false);
  const descriptor = POWER_CARD_REGISTRY[cardName];
  if (!descriptor) return null;

  const CardComponent = descriptor.Card;
  const displayName = formatCardName(cardName);

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="group relative inline-flex items-center gap-2.5 rounded-lg border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.06)] px-4 py-2 text-sm font-medium text-[var(--primary)] transition-colors hover:border-[rgba(224,141,255,0.45)] hover:bg-[rgba(224,141,255,0.12)] hover:shadow-[0_0_24px_rgba(224,141,255,0.18)]"
    >
      {/* small power card */}
      <motion.span
        animate={hovered ? { rotate: [0, -6, 6, 0], scale: 1.1 } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] transition-colors group-hover:border-[rgba(224,141,255,0.4)] group-hover:shadow-[0_0_10px_rgba(224,141,255,0.15)]"
      >
        <CardComponent size={24} />
      </motion.span>

      {/* text with crossfade */}
      <span className="relative min-w-[10rem] overflow-hidden text-left" style={{ height: "1.25rem" }}>
        <AnimatePresence mode="wait">
          {!hovered ? (
            <motion.span
              key="sabotage"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              Sabotage {opponentName}
            </motion.span>
          ) : (
            <motion.span
              key="cardname"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {displayName}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

/* ═══════════════════════════ TOP BAR ═════════════════════════════════ */

export function TopBar() {
  return (
    <nav className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--ghost-border)] bg-[rgba(10,14,20,0.96)] px-6">
      {/* LEFT — Opponent status card */}
      <div className="flex min-w-0 flex-1 items-center">
        <OpponentCard />
      </div>

      {/* CENTER — Timer */}
      <div className="flex items-center justify-center px-6">
        <MatchTimer />
      </div>

      {/* RIGHT — Power card + Run/Submit */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {/* Power card sabotage button */}
        {!POWER_CARD.used && (
          <SabotageButton cardName={POWER_CARD.name} opponentName={OPPONENT.username} />
        )}

        {/* Run button */}
        <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.04)] px-5 py-2 text-sm font-medium text-[var(--on-background)] transition hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.08)]">
          <Play className="h-4 w-4" />
          Run
        </button>

        {/* Submit button */}
        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[#0a0e14] shadow-[0_0_18px_rgba(224,141,255,0.2)] transition hover:-translate-y-px hover:opacity-90">
          <Send className="h-4 w-4" />
          Submit
        </button>
      </div>
    </nav>
  );
}
